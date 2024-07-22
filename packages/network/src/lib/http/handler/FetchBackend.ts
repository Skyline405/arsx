import { ReadableStreamLike, concatMap, from, map, of, startWith, switchMap, tap, toArray } from "rxjs"
import { fromFetch } from 'rxjs/fetch'
import { HttpBackend } from "./HttpHandler"
import { NetworkStream } from "../../core/NetworkStream"
import { HttpDownloadProgressEvent, HttpEvent, HttpSentEvent } from "../HttpEvent"
import { buildRequestParams } from "../HttpRequest"
import { HttpHeaders } from "../HttpHeaders"
import { HttpErrorResponse, HttpHeaderResponse, HttpResponse, getContentHeaders } from "../HttpResponse"
import { decodeResponseBody } from "../HttpCodec"

export const fetchBackend = (
  baseUrl?: string,
): HttpBackend =>
  (context) => (request) => {
    const {
      url, headers, body, method, withCredentials,
      responseType, reportProgress,
    } = buildRequestParams(request, baseUrl)

    if (method.toUpperCase() === 'JSONP')
      throw new Error(`"JSONP" method is not supported by "${fetchBackend.name}"`)

    return fromFetch(url, {
      body,
      method,
      credentials: withCredentials ? 'include' : undefined,
      headers: headers.toRecord(),
    }).pipe(
      concatMap((response) => {
        return new NetworkStream<HttpEvent<unknown>>((sub) => {
          const { status, statusText } = response
          const headers = new HttpHeaders(response.headers)

          of(response)
            .pipe(
              switchMap((response) => {
                if (response.body == null) return of(null)

                const { contentType, contentLength } = getContentHeaders(headers)

                let receivedLength = 0
                let partialText: string | undefined

                const decoder = new TextDecoder()

                if (reportProgress) {
                  sub.next(new HttpHeaderResponse({
                    headers,
                    status,
                    statusText,
                    url,
                  }))
                }

                return from(response.body as ReadableStreamLike<Uint8Array>)
                  .pipe(
                    tap((value) => {
                      receivedLength += value.length

                      if (!reportProgress) return

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
                const responseUrl = response.url ?? headers.get('X-Request-URL') ?? url
                const responseInit = { status, statusText, headers, url: responseUrl }

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

function concatChunks(chunks: Uint8Array[], length: number): Uint8Array {
  let cursor = 0
  return chunks.reduce((res, chunk) => {
    res.set(chunk, cursor)
    cursor += chunk.length
    return res
  }, new Uint8Array(length))
}
