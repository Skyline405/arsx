import { PartialIf } from "../../types/utils"
import { HttpEventType, IHttpEvent } from "./HttpEvent"
import { HttpHeaders } from "./HttpHeaders"
import { HttpStatusCode } from "./HttpStatusCode"

export interface HttpResponseInitBase {
  readonly headers?: HttpHeaders
  readonly status?: number
  readonly statusText?: string
  readonly url?: string
}

export type HttpResponseInit<T> =
  HttpResponseInitBase & PartialIf<T, { readonly body: T }>

export type HttpErrorResponseInit<T> =
  HttpResponseInitBase & PartialIf<T, { readonly error: T }>

abstract class HttpResponseBase {
  readonly headers: HttpHeaders
  readonly status: number
  readonly statusText: string
  readonly url?: string

  get ok(): boolean {
    return this.status >= 200 && this.status < 300
  }

  constructor(
    init: HttpResponseInit<any>,
    defaultStatus: number = HttpStatusCode.Ok,
    defaultStatusText = 'OK',
  ) {
    this.headers = init.headers ?? new HttpHeaders()
    this.status = init.status || defaultStatus
    this.statusText = init.statusText ?? defaultStatusText
    this.url = init.url
  }

  static StatusCode = HttpStatusCode
}

export class HttpHeaderResponse extends HttpResponseBase implements IHttpEvent {
  readonly type: HttpEventType.ResponseHeader = HttpEventType.ResponseHeader

  constructor(init: HttpResponseInit<undefined>) {
    super(init)
  }

  clone(update: Partial<HttpResponseInit<undefined>> = {}): HttpHeaderResponse {
    return new HttpHeaderResponse({
      headers: update.headers ?? this.headers,
      status: update.status ?? this.status,
      statusText: update.statusText ?? this.statusText,
    } as Required<HttpResponseInit<undefined>>)
  }
}

export class HttpResponse<T = unknown> extends HttpResponseBase implements IHttpEvent<T> {
  readonly type: HttpEventType.Response = HttpEventType.Response
  readonly body: T

  constructor(init: HttpResponseInit<T>) {
    super(init)
    this.body = init.body as T
  }

  clone<V = T>(update: Partial<HttpResponseInit<V>> = {}): HttpResponse<V> {
    return new HttpResponse<any>({
      headers: update.headers ?? this.headers,
      status: update.status ?? this.status,
      statusText: update.statusText ?? this.statusText,
      body: typeof update.body !== 'undefined' ? update.body : this.body,
      url: update.url ?? this.url
    } as Required<HttpResponseInit<V>>)
  }
}

export class HttpErrorResponse<T = unknown> extends HttpResponseBase {
  readonly name = this.constructor.name
  readonly error?: T
  readonly message: string

  constructor(init: HttpErrorResponseInit<T>) {
    super(init, 0, 'Unknown Error')
    this.error = init.error
    this.message = `Status: ${this.status} | StatusText: ${this.statusText}`
  }
}
