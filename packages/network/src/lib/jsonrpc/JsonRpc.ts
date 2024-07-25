import { PartialIf } from "../../types/utils"
import { isObject } from "../../utils/typeof"

/* eslint-disable @typescript-eslint/no-namespace */
export namespace JsonRpc {
  export type Id = string | number | null

  export type ErrorObject<T = undefined> = {
    readonly code: number
    readonly message: string
  } & PartialIf<T, { readonly data: T }>

  export type Message = {
    readonly id: Id
    readonly jsonrpc: '2.0'
  }

  export type Request<T = any> = {
    readonly params?: unknown
    readonly method: string
  } & PartialIf<T, { readonly params: T }>
    & Partial<Message>

  export type Notification<T = unknown> = Omit<Request<T>, 'id'>

  export type Success<T = unknown> = Message & {
    readonly result: T
  }

  export type Error<T = undefined> = Message & {
    readonly error: ErrorObject<T>
  }

  export enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
  }

  export type Response<T = unknown, E = unknown> = Success<T> | Error<E>

  export function isMessage(message: unknown): message is JsonRpc.Message {
    return isObject(message)
      && 'id' in message
      && 'jsonrpc' in message
      && message.jsonrpc === '2.0'
  }

  export function isRequest<T>(message: unknown): message is JsonRpc.Request<T> {
    return isMessage(message)
      && 'method' in message
  }

  export function isSuccess<T>(message: unknown): message is JsonRpc.Success<T> {
    return isMessage(message)
      && 'result' in message
  }

  export function isError<T>(message: unknown): message is JsonRpc.Error<T> {
    return isMessage(message)
      && 'error' in message
  }

  export function isResponse<T, E>(message: unknown): message is JsonRpc.Response<T, E> {
    return isError(message) || isSuccess(message)
  }
}
