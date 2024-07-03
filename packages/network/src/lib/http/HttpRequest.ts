import { PartialIf } from "../../types/utils"
import { HttpContext } from "./HttpContext"
import { HttpHeaders, HttpHeadersInit } from "./HttpHeaders"
import {
  isArrayBuffer,
  isBlob,
  isFormData,
  isNull,
  isString,
  isUrlSearchParams,
} from '../../utils/typeof'

const ResponseTypeSymbol = Symbol()

export type HttpResponseType =
  | 'json'
  | 'text'
  | 'blob'
  | 'arraybuffer'

export type SerializedBody =
  | ArrayBuffer
  | Blob
  | FormData
  | string
  | null

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
  readonly context?: HttpContext
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
  readonly context: HttpContext

  constructor(init: HttpRequestInit<T>) {
    this.method = init.method
    this.url = init.url
    this.params = init.params
    this.body = init.body as T
    this.withCredentials = init.withCredentials ?? false
    this.headers = new HttpHeaders(init.headers)
    this.responseType = (init.responseType || 'json')
    this.reportProgress = init.reportProgress ?? false
    this.context = init.context ?? new HttpContext()
  }

  clone<V = T>(update: Partial<HttpRequestInit<V>> = {}): HttpRequest<V, R> {
    return new HttpRequest<any, R>({
      body: typeof update.body !== 'undefined' ? update.body : this.body,
      headers: update.headers ?? this.headers,
      method: update.method ?? this.method,
      params: update.params ?? this.params,
      responseType: update.responseType ?? this.responseType,
      url: update.url ?? this.url,
      withCredentials: update.withCredentials ?? this.withCredentials,
      reportProgress: update.reportProgress ?? this.reportProgress,
      context: update.context ?? this.context
    } as Required<HttpRequestInit<V>>)
  }

  serializeBody(): T | string | null {
    const isSpecialType = [
      isArrayBuffer,
      isBlob,
      isFormData,
      isUrlSearchParams,
      isString,
      isNull,
    ].some((typeGuard) => typeGuard(this.body))

    if (isSpecialType) return this.body

    if (typeof this.body === 'object' || typeof this.body === 'boolean') {
      return JSON.stringify(this.body)
    }

    return this.body
  }

  detectContentType(): string | undefined {
    const isUndefinedType = [
      isArrayBuffer,
      isFormData,
      isNull,
    ].some((typeGuard) => typeGuard(this.body))

    if (isUndefinedType) return
    if (isString(this.body)) return 'text/plain'
    if (typeof this.body === 'object'
      || typeof this.body === 'number'
      || typeof this.body === 'boolean')
      return 'application/json'

    return
  }

  protected [ResponseTypeSymbol]!: R
}
