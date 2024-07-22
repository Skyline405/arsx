import { PartialIf } from "../../types/utils"
import { HttpHeaders, HttpHeadersInit } from "./HttpHeaders"
import { HttpResponseType, detectContentType, encodeBody } from "./HttpCodec"
import { NetworkContext } from "./public-api"

export type HttpMethod =
  | 'GET'
  | 'HEAD'
  | 'DELETE'
  | 'OPTIONS'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  // | 'JSONP'

export type HttpRequestProgressType =
  | 'upload'
  | 'download'

export interface HttpRequestInitBase {
  readonly method?: string
  readonly url: string
  readonly params?: string | Record<string, any> | string[][] | URLSearchParams
  readonly headers?: HttpHeadersInit
  readonly withCredentials?: boolean
  readonly responseType?: HttpResponseType
  readonly reportProgress?: boolean | HttpRequestProgressType
  readonly context?: NetworkContext
}

export type HttpRequestInit<T> =
  HttpRequestInitBase & PartialIf<T, { readonly body: T }>

export class HttpRequest<T = any> {
  readonly method: string
  readonly url: string
  readonly params: URLSearchParams
  readonly body: T
  readonly headers: HttpHeaders
  readonly withCredentials: boolean
  readonly responseType: HttpResponseType
  readonly reportProgress: boolean | HttpRequestProgressType

  constructor(init: HttpRequestInit<T>) {
    this.method = init.method ?? 'GET'
    this.url = init.url
    this.params = new URLSearchParams(init.params)
    this.body = init.body as T
    this.withCredentials = init.withCredentials ?? false
    this.headers = new HttpHeaders(init.headers)
    this.responseType = (init.responseType || 'json')
    this.reportProgress = init.reportProgress ?? false
  }

  clone<V = T>(update: Partial<HttpRequestInit<V>> = {}): HttpRequest<V> {
    return new HttpRequest<any>({
      body: 'body' in update ? update.body : this.body,
      headers: update.headers ?? this.headers,
      method: update.method ?? this.method,
      params: update.params ?? this.params,
      responseType: update.responseType ?? this.responseType,
      url: update.url ?? this.url,
      withCredentials: update.withCredentials ?? this.withCredentials,
      reportProgress: update.reportProgress ?? this.reportProgress,
    } as Required<HttpRequestInit<V>>)
  }
}

// Helpers

const includeProgress = (
  flag: boolean | HttpRequestProgressType,
  type: HttpRequestProgressType
): boolean => flag === true || flag === type

export function buildRequestParams(request: HttpRequest<unknown>, baseUrl?: string) {
  const { method, body, reportProgress, responseType, withCredentials } = request
  const url = new URL(request.url, baseUrl)
  const params = new URLSearchParams(request.params)
  url.search = params.toString()

  const headers = new HttpHeaders(request.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain, */*')
  }

  if (!headers.has('Content-Type')) {
    const contentType = detectContentType(body)
    if (contentType != null) {
      headers.set('Content-Type', contentType)
    }
  }

  const includeDownloadProgress = includeProgress(reportProgress, 'download')
  const includeUploadProgress = body != null && includeProgress(reportProgress, 'upload')

  return {
    method,
    url: url.href,
    headers,
    body: encodeBody(body),
    responseType,
    withCredentials,
    includeDownloadProgress,
    includeUploadProgress,
  } as const
}
