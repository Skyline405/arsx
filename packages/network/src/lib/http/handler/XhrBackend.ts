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
        const { withCredentials, responseType, headers } = params
        const xhr = xhrFactory.build()

        xhr.withCredentials = Boolean(withCredentials)
        xhr.responseType = responseType

        headers.forEach((values, key) => {
          xhr.setRequestHeader(key, values.join(','))
        })

        return xhr
      }),
      switchMap((xhr) => {
        return new NetworkStream<HttpEvent<unknown>>((sub) => {
          const finalizer = new AbortController()
          const { signal } = finalizer

          let _responseHeaders: HttpHeaders | undefined

          const getResponseParams = () => {
            if (!_responseHeaders) {
              _responseHeaders = new HttpHeaders(xhr.getAllResponseHeaders())
            }

            const { status, statusText, response: body } = xhr
            const url = xhr.responseURL
              ?? _responseHeaders.get(HTTP_HEADER.X_REQUEST_URL)
              ?? params.url

            return {
              status,
              statusText,
              body,
              headers: _responseHeaders,
              url,
            }
          }

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

          xhr.open(params.method, params.url)
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
