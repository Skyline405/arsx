import { ReadableStreamLike, from, map, of, switchMap, tap, toArray } from "rxjs"
import { HttpBackend } from "./HttpHandler"
import { NetworkStream } from "../../core/NetworkStream"
import { HttpDownloadProgressEvent, HttpEvent, HttpSentEvent } from "../HttpEvent"
import { buildRequestParams } from "../HttpRequest"
import { HttpHeaders } from "../HttpHeaders"
import { HttpErrorResponse, HttpHeaderResponse, HttpResponse } from "../HttpResponse"
import { decodeResponseBody } from "../HttpCodec"

export const fetchBackend = (
  baseUrl?: string,
  fetch = globalThis.fetch,
): HttpBackend =>
  (context) => (request) => {
    const { url, headers, body, method, withCredentials, responseType } = buildRequestParams(request, baseUrl)

    const abortController = new AbortController()

    return of(request).pipe(
      switchMap(() => {
        return new NetworkStream<HttpEvent<unknown>>((sub) => {
          const fetchPromise = fetch(url, {
            body,
            method,
            signal: abortController.signal,
            credentials: withCredentials ? 'include' : undefined,
            headers: headers.toRecord(),
          })

          from(fetchPromise)
            .pipe(
              switchMap((response) => {
                const { status, statusText } = response
                const headers = new HttpHeaders(response.headers)

                if (request.reportProgress) {
                  sub.next(new HttpHeaderResponse({
                    headers,
                    status,
                    statusText,
                    url,
                  }))
                }

                if (response.body == null) return of(null)

                const contentType = response.headers.get('Content-Type') ?? undefined
                const contentLength = response.headers.get('Content-Length')

                let receivedLength = 0
                let partialText: string | undefined

                const decoder = new TextDecoder()

                return from(response.body as ReadableStreamLike<Uint8Array>)
                  .pipe(
                    tap((value) => {
                      receivedLength += value.length

                      if (!request.reportProgress) return

                      if (responseType === 'text') {
                        if (partialText == null) partialText = ''
                        partialText += decoder.decode(value, { stream: true })
                      }

                      sub.next(new HttpDownloadProgressEvent(
                        receivedLength,
                        contentLength ? parseInt(contentLength) : undefined,
                        partialText,
                      ))
                    }),
                    toArray(),
                    map((chunks) => {
                      let cursor = 0
                      return chunks.reduce((res, chunk) => {
                        res.set(chunk, cursor)
                        cursor += chunk.length
                        return res
                      }, new Uint8Array(receivedLength))
                    }),
                    map((buffer) => decodeResponseBody(buffer, responseType, contentType)),
                    map((body) => {
                      const isOk = status >= 200 && status < 300

                      if (isOk) {
                        return new HttpResponse({
                          body,
                          status,
                          statusText,
                          headers,
                          url,
                        })
                      } else {
                        throw new HttpErrorResponse({
                          error: body,
                          status,
                          statusText,
                          headers,
                          url,
                        })
                      }
                    })
                  )
              }),
            )
            .subscribe(sub as any)

          sub.next(new HttpSentEvent())

          return () => {
            abortController.abort()
          }
        })
      }),
    )
  }
