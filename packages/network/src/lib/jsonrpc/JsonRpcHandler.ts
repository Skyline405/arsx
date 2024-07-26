import { NetworkHandler, NetworkMiddleware } from "../core/NetworkHandler"
import { HttpRequest } from "../http/HttpRequest"
import { JsonRpc } from "./JsonRpc"
import { takeBody } from "../http/rxjs-interop"
import { HttpHandler } from "../http/public-api"
import { Observable, from, of, switchMap } from "rxjs"

export type JsonRpcHandler = NetworkHandler<JsonRpc.Request | JsonRpc.Request[], JsonRpc.Response>

export const jsonRpcHttpAdapter = ((
  backend,
  url = '',
) => (context) => (input) => {
  const body = resolveRpcBatch(input)
  if (!body) throw new TypeError(`JsonRpc request is ${typeof body}`)
  return backend(context)(
    new HttpRequest<JsonRpc.Request | JsonRpc.Request[]>({
      method: 'POST',
      url,
      body,
      responseType: 'json',
    }),
  ).pipe(
    takeBody<JsonRpc.Response | JsonRpc.Response[]>(),
    switchMap((output) => flatStream(output)),
  )
}) satisfies NetworkMiddleware<JsonRpcHandler, HttpHandler>

// Helpers

function flatStream<T>(value: T | T[]): Observable<T> {
  if (Array.isArray(value)) return from(value)
  return of(value)
}

function resolveRpcBatch<T>(value: T | T[]): T | T[] |  undefined {
  if (Array.isArray(value)) {
    if (value.length > 1) return value
    return value.at(0)
  }
  return value
}
