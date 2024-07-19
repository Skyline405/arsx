import { PartialIf } from "../../types/utils"
import { HttpHeaders, HttpHeadersInit } from "./HttpHeaders"
import { HttpResponseType, detectContentType, encodeBody } from "./HttpCodec"
import { NetworkContext } from "./public-api"

const ResponseTypeSymbol = Symbol()

export type HttpMethod =
  | 'GET'
  | 'HEAD'
  | 'DELETE'
  | 'OPTIONS'
  | 'POST'
  | 'PUT'
  | 'PATCH'

export interface HttpRequestInitBase {
  readonly method: string
  readonly url: string
  readonly params?: Record<string, any>
  readonly headers?: HttpHeadersInit
  readonly withCredentials?: boolean
  readonly responseType?: HttpResponseType
  readonly reportProgress?: boolean
  readonly context?: NetworkContext
}

export type HttpRequestInit<T> =
  HttpRequestInitBase & PartialIf<T, { readonly body: T }>

export class HttpRequest<T = any, R = any> {
  readonly method: string
  readonly url: string
  readonly params?: Record<string, any>
  readonly body: T
  readonly headers: HttpHeaders
  readonly withCredentials: boolean
  readonly responseType: HttpResponseType
  readonly reportProgress: boolean

  constructor(init: HttpRequestInit<T>) {
    this.method = init.method
    this.url = init.url
    this.params = init.params
    this.body = init.body as T
    this.withCredentials = init.withCredentials ?? false
    this.headers = new HttpHeaders(init.headers)
    this.responseType = (init.responseType || 'json')
    this.reportProgress = init.reportProgress ?? false
  }

  clone<V = T>(update: Partial<HttpRequestInit<V>> = {}): HttpRequest<V, R> {
    return new HttpRequest<any, R>({
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

  protected [ResponseTypeSymbol]!: R
}

export function buildRequestParams(request: HttpRequest<unknown>, baseUrl?: string) {
  const url = new URL(request.url, baseUrl)
  const params = new URLSearchParams(request.params)
  url.search = params.toString()

  const headers = new HttpHeaders(request.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain, */*')
  }

  if (!headers.has('Content-Type')) {
    const contentType = detectContentType(request.body)
    if (contentType != null) {
      headers.set('Content-Type', contentType)
    }
  }

  return {
    method: request.method,
    url: url.href,
    headers,
    body: encodeBody(request.body),
    reportProgress: request.reportProgress,
    responseType: request.responseType,
    withCredentials: request.withCredentials,
  }
}
