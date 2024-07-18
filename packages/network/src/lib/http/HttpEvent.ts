import { HttpHeaderResponse, HttpResponse } from "./HttpResponse"

export enum HttpEventType {
  Sent,
  UploadProgress,
  ResponseHeader,
  DownloadProgress,
  Response,
  UserEvent,
}

export type HttpEvent<T = any> =
  | HttpSentEvent
  | HttpUploadProgressEvent
  | HttpHeaderResponse
  | HttpDownloadProgressEvent
  | HttpResponse<T>
  | HttpUserEvent<T>

export interface IHttpEvent<T = any> {
  readonly type: HttpEventType
}

export abstract class HttpProgressEvent implements IHttpEvent {
  abstract readonly type: HttpEventType.DownloadProgress | HttpEventType.UploadProgress

  constructor(
    readonly loaded: number,
    readonly total?: number,
  ) {}
}

export class HttpSentEvent implements IHttpEvent {
  readonly type: HttpEventType.Sent = HttpEventType.Sent
}

export class HttpDownloadProgressEvent extends HttpProgressEvent {
  readonly type: HttpEventType.DownloadProgress = HttpEventType.DownloadProgress

  constructor(
    loaded: number,
    total?: number,
    readonly partialText?: string
  ) {
    super(loaded, total)
  }
}

export class HttpUploadProgressEvent extends HttpProgressEvent {
  readonly type: HttpEventType.UploadProgress = HttpEventType.UploadProgress
}

export class HttpUserEvent<T> implements IHttpEvent<T> {
  readonly type: HttpEventType.UserEvent = HttpEventType.UserEvent
}
