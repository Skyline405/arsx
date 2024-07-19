import { from, map, switchMap } from "rxjs"
import { NetworkStream } from "../../core/NetworkStream"
import { HttpDownloadProgressEvent, HttpEvent, HttpSentEvent, HttpUploadProgressEvent } from "../HttpEvent"
import { HTTP_HEADER, HttpHeaders } from "../HttpHeaders"
import { HttpErrorResponse, HttpHeaderResponse, HttpResponse } from "../HttpResponse"
import { HttpBackend } from "./HttpHandler"
import { XhrFactory } from "./XhrFactory"
import { buildRequestParams } from "../HttpRequest"

export const xhrBackend = (
  baseUrl?: string,
  xhrFactory = XhrFactory.create(),
): HttpBackend =>
  (context) => (input) => {
    const params = buildRequestParams(input, baseUrl)

    if (params.method.toUpperCase() === 'JSONP')
      throw new Error(`"JSONP" method is not supported by "${xhrBackend.name}"`)

    return from(xhrFactory.load()).pipe(
      map(() => {
        const { method, url, withCredentials, responseType, headers } = params
        const xhr = xhrFactory.build()
        xhr.open(method, url)

        xhr.withCredentials = Boolean(withCredentials)
        xhr.responseType = responseType

        headers.forEach((values, key) => {
          xhr.setRequestHeader(key, values.join(','))
        })

        return xhr
      }),
      switchMap((xhr) => {
        return new NetworkStream<HttpEvent<unknown>>((sub) => {
          const onLoad = () => {
            const isOk = xhr.status >= 200 && xhr.status < 300
            const body = xhr.response
            const { status, statusText } = xhr
            const headers = new HttpHeaders(xhr.getAllResponseHeaders())

            const url = xhr.responseURL
              ?? headers.get(HTTP_HEADER.X_REQUEST_URL)
              ?? params.url

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
            const { status, statusText } = xhr
            const headers = new HttpHeaders(xhr.getAllResponseHeaders())
            const url = xhr.responseURL
              ?? headers.get(HTTP_HEADER.X_REQUEST_URL)
              ?? params.url


            sub.error(new HttpErrorResponse({
              error,
              status,
              statusText,
              url,
              headers,
            }))
          }

          let headersSent = false

          const onDownloadProgress = (event: ProgressEvent) => {
            if (!headersSent) {
              const { status, statusText } = xhr
              const headers = new HttpHeaders(xhr.getAllResponseHeaders())
              const url = xhr.responseURL
                ?? headers.get(HTTP_HEADER.X_REQUEST_URL)
                ?? params.url

              sub.next(new HttpHeaderResponse({
                headers,
                status,
                statusText,
                url,
              }))
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

          const { reportProgress, body } = params

          if (reportProgress) {
            xhr.addEventListener('progress', onDownloadProgress)
            if (body != null) {
              xhr.upload.addEventListener('progress', onUploadProgress)
            }
          }

          xhr.send(body)
          sub.next(new HttpSentEvent())

          return () => {
            xhr.removeEventListener('load', onLoad)
            xhr.removeEventListener('error', onError)
            xhr.removeEventListener('timeout', onError)
            xhr.removeEventListener('abort', onError)

            if (reportProgress) {
              xhr.removeEventListener('progress', onDownloadProgress)
              if (body != null) {
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
  }
