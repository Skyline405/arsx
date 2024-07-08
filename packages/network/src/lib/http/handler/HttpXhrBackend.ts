import { from, map, switchMap, take, tap } from "rxjs"
import { NetworkStream } from "../../NetworkStream"
import { HttpDownloadProgressEvent, HttpEvent, HttpSentEvent, HttpUploadProgressEvent } from "../HttpEvent"
import { HttpHeaders } from "../HttpHeaders"
import { HttpRequest } from "../HttpRequest"
import { HttpErrorResponse, HttpHeaderResponse, HttpResponse } from "../HttpResponse"
import { HttpBackend } from "./HttpHandler"
import { XhrFactory } from "./XhrFactory"

function partialFromXhr(xhr: XMLHttpRequest): () => HttpHeaderResponse {
  const status = xhr.status
  const statusText = xhr.statusText
  const headers = new HttpHeaders(xhr.getAllResponseHeaders())
  const url = xhr.responseURL || headers.get('X-Request-URL').join('')
  const headerResponse = new HttpHeaderResponse({
    status,
    statusText,
    headers,
    url,
  })
  return () => headerResponse
}

export const httpXhrBackend = (
  baseUrl?: string,
  xhrFactory = XhrFactory.create(),
): HttpBackend =>
  (request$: NetworkStream<HttpRequest<any>>) =>
    request$.pipe(
      take(1),
      tap((request) => {
        if (request.method.toUpperCase() === 'JSONP')
          throw new Error(`"JSONP" method is not supported by "${httpXhrBackend.name}"`)
      }),
      switchMap((request) => {
        return from(xhrFactory.load()).pipe(
          map(() => request)
        )
      }),
      switchMap((request) => {
        return new NetworkStream<HttpEvent<unknown>>((sub) => {
          const xhr = xhrFactory.build()
          const url = new URL(request.url, baseUrl)
          const params = new URLSearchParams(request.params)
          url.search = params.toString()
          xhr.open(request.method, url.href)

          xhr.withCredentials = Boolean(request.withCredentials)
          xhr.responseType = request.responseType

          request.headers.forEach((values, key) => {
            xhr.setRequestHeader(key, values.join(', '))
          })

          if (!request.headers.has('Accept')) {
            xhr.setRequestHeader('Accept', 'application/json, text/plain, */*')
          }

          if (!request.headers.has('Content-Type')) {
            const contentType = request.detectContentType()
            if (contentType != null) {
              xhr.setRequestHeader('Content-Type', contentType)
            }
          }

          const partialXhr = partialFromXhr(xhr)

          const onLoad = () => {
            const isOk = xhr.status >= 200 && xhr.status < 300
            const body = xhr.response
            const { status, statusText, headers, url } = partialXhr()

            if (isOk) {
              sub.next(new HttpResponse({
                body,
                status,
                statusText,
                headers,
                url,
              }))
              sub.complete()
            } else {
              sub.error(new HttpErrorResponse({
                error: body,
                status,
                statusText,
                headers,
                url,
              }))
            }
          }

          const onError = (error: ProgressEvent) => {
            const { status, statusText } = partialXhr()

            sub.error(new HttpErrorResponse({
              error,
              status,
              statusText,
            }))
          }

          let headersSent = false

          const onDownloadProgress = (event: ProgressEvent) => {
            if (!headersSent) {
              const headersResponse = partialXhr()
              sub.next(headersResponse)
              headersSent = true
            }

            const partialText = xhr.responseType === 'text' && Boolean(xhr.responseText)
              ? xhr.responseText : undefined

            sub.next(new HttpDownloadProgressEvent(
              event.loaded,
              event.total,
              partialText,
            ))
          }

          const onUploadProgress = (event: ProgressEvent) => {
            sub.next(new HttpUploadProgressEvent(
              event.loaded,
              event.total,
            ))
          }

          xhr.addEventListener('load', onLoad)
          xhr.addEventListener('error', onError)
          xhr.addEventListener('timeout', onError)
          xhr.addEventListener('abort', onError)

          if (request.reportProgress) {
            xhr.addEventListener('progress', onDownloadProgress)
            if (request.body != null) {
              xhr.upload.addEventListener('progress', onUploadProgress)
            }
          }

          xhr.send(request.serializeBody())
          sub.next(new HttpSentEvent())

          return () => {
            xhr.removeEventListener('load', onLoad)
            xhr.removeEventListener('error', onError)
            xhr.removeEventListener('timeout', onError)
            xhr.removeEventListener('abort', onError)

            if (request.reportProgress) {
              xhr.removeEventListener('progress', onDownloadProgress)
              if (request.body != null) {
                xhr.upload.removeEventListener('progress', onUploadProgress)
              }
            }

            if (xhr.readyState !== xhr.DONE) {
              xhr.abort()
            }
          }
        }) // NetworkStream
      }), // switchMap
    ) // pipe
