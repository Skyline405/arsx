import { from, map, switchMap } from "rxjs"
import { NetworkStream } from "../../core/NetworkStream"
import { HttpDownloadProgressEvent, HttpEvent, HttpSentEvent, HttpUploadProgressEvent } from "../HttpEvent"
import { HTTP_HEADER, HttpHeaders } from "../HttpHeaders"
import { HttpErrorResponse, HttpHeaderResponse, HttpResponse } from "../HttpResponse"
import { HttpBackendFactory, HttpHandler } from "./HttpHandler"
import { XhrFactory } from "./XhrFactory"
import { buildRequestParams } from "../HttpRequest"

export const xhrBackend = ((
  baseUrl?: string,
  xhrFactory = XhrFactory.create(),
): HttpHandler =>
  (context) => (input) => {
    const params = buildRequestParams(input, baseUrl)

    if (params.method.toUpperCase() === 'JSONP')
      throw new Error(`"JSONP" method is not supported by "${xhrBackend.name}"`)

    return from(xhrFactory.load()).pipe(
      map(() => xhrFactory.build()),
      switchMap((xhr) => {
        return new NetworkStream<HttpEvent<unknown>>((sub) => {
          const finalizer = new AbortController()
          const { signal } = finalizer

          const getResponseParams = ((xhr) => {
            let headers: HttpHeaders | undefined
            let url: string | undefined

            return () => {
              if (!headers) {
                headers = new HttpHeaders(xhr.getAllResponseHeaders())
              }

              if (!url) {
                url = xhr.responseURL
                  ?? headers.get(HTTP_HEADER.X_REQUEST_URL)
                  ?? params.url
              }

              const { status, statusText, response: body } = xhr

              return {
                status,
                statusText,
                body,
                headers,
                url,
              }
            }
          })(xhr)

          const onLoad = () => {
            const isOk = xhr.status >= 200 && xhr.status < 300
            const { body, headers, status, statusText, url } = getResponseParams()
            const responseInit = { status, statusText, headers, url }

            if (isOk) {
              sub.next(new HttpResponse({
                ...responseInit,
                body,
              }))
              sub.complete()
            } else {
              sub.error(new HttpErrorResponse({
                ...responseInit,
                error: body,
              }))
            }
          }

          const onError = (error: ProgressEvent) => {
            const { headers, status, statusText, url } = getResponseParams()

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
              const { headers, status, statusText, url } = getResponseParams()

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
              event.lengthComputable ? event.total : undefined,
              partialText,
            ))
          }

          const onUploadProgress = (event: ProgressEvent) => {
            sub.next(new HttpUploadProgressEvent(
              event.loaded,
              event.total,
            ))
          }

          xhr.addEventListener('load', onLoad, { signal })
          xhr.addEventListener('error', onError, { signal })
          xhr.addEventListener('timeout', onError, { signal })
          xhr.addEventListener('abort', onError, { signal })

          if (params.includeDownloadProgress) {
            xhr.addEventListener('progress', onDownloadProgress, { signal })
          }

          if (params.includeUploadProgress) {
            xhr.upload.addEventListener('progress', onUploadProgress, { signal })
          }

          // subscribe on events before open
          xhr.open(params.method, params.url)

          xhr.withCredentials = Boolean(params.withCredentials)
          xhr.responseType = params.responseType

          params.headers.forEach((values, key) => {
            xhr.setRequestHeader(key, values.join(','))
          })

          xhr.send(params.body)
          sub.next(new HttpSentEvent())

          return () => {
            finalizer.abort()

            if (xhr.readyState !== xhr.DONE) {
              xhr.abort()
            }
          }
        }) // NetworkStream
      }), // switchMap
    ) // pipe
  }
) satisfies HttpBackendFactory
