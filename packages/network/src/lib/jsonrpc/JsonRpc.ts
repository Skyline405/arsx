import { isObject } from "../../utils/typeof"

/* eslint-disable @typescript-eslint/no-namespace */
export namespace JsonRpc {
  export type Id = string | number | null

  export interface ErrorObject<T = undefined> {
    code: number
    message: string
    data: T
  }

  export interface Message {
    jsonrpc: '2.0'
    id: Id
  }

  export interface Request<T = unknown> extends Message {
    params: T
    method: string
  }

  export type Notification<T = unknown> = Omit<Request<T>, 'id'>

  export interface Success<T = unknown> extends Message {
    result: T
  }

  export interface Error<T = unknown> extends Message {
    error: ErrorObject<T>
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
      && 'jsonrpc' in message
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
