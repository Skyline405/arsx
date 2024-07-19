import { ReadableStreamLike, concatMap, from, map, of, startWith, switchMap, tap, toArray } from "rxjs"
import { fromFetch } from 'rxjs/fetch'
import { HttpBackend } from "./HttpHandler"
import { NetworkStream } from "../../core/NetworkStream"
import { HttpDownloadProgressEvent, HttpEvent, HttpSentEvent } from "../HttpEvent"
import { buildRequestParams } from "../HttpRequest"
import { HttpHeaders } from "../HttpHeaders"
import { HttpErrorResponse, HttpHeaderResponse, HttpResponse } from "../HttpResponse"
import { decodeResponseBody } from "../HttpCodec"

export const fetchBackend = (
  baseUrl?: string,
): HttpBackend =>
  (context) => (request) => {
    const { url, headers, body, method, withCredentials, responseType } = buildRequestParams(request, baseUrl)

    return of(request).pipe(
      switchMap(() => {
        return fromFetch(url, {
          body,
          method,
          credentials: withCredentials ? 'include' : undefined,
          headers: headers.toRecord(),
        })
      }),
      concatMap((response) => {
        return new NetworkStream<HttpEvent<any>>((sub) => {
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

          of(response)
            .pipe(
              switchMap((response) => {
                if (response.body == null) return of(null)

                const { contentType, contentLength } = getContentHeaders(headers)

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
                        contentLength,
                        partialText,
                      ))
                    }),
                    toArray(),
                    map((chunks) => concatChunks(chunks, receivedLength)),
                    map((buffer) => decodeResponseBody(buffer, responseType, contentType)),
                  )
              }),
              map((body) => {
                const isOk = status >= 200 && status < 300
                const responseInit = { status, statusText, headers, url }

                if (isOk) {
                  return new HttpResponse({
                    ...responseInit,
                    body,
                  })
                } else {
                  throw new HttpErrorResponse({
                    ...responseInit,
                    error: body,
                  })
                }
              })
            )
            .subscribe(sub)

        })
      }),
      startWith(new HttpSentEvent()),
    )
  }

function getContentHeaders(headers: HttpHeaders) {
  const type = headers.get('Content-Type') ?? undefined
  const length = headers.get('Content-Length')

  return {
    contentType: type,
    contentLength: length ? parseInt(length) : undefined,
  }
}

function concatChunks(chunks: Uint8Array[], length: number): Uint8Array {
  let cursor = 0
  return chunks.reduce((res, chunk) => {
    res.set(chunk, cursor)
    cursor += chunk.length
    return res
  }, new Uint8Array(length))
}
