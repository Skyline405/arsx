import { NetworkHandler } from "../core/NetworkHandler"
import { HttpRequest } from "../http/HttpRequest"
import { JsonRpc } from "./JsonRpc"
import { takeBody } from "../http/rxjs-interop"
import { HttpHandler, xhrBackend } from "../http/public-api"
import { createIntGenerator } from "./utils"

export type JsonRpcHandler = NetworkHandler<JsonRpc.Request, JsonRpc.Response>

export const jsonRpcHttpHandler = (
  url: string,
  backend: HttpHandler = xhrBackend(),
  idGenerator: Generator<unknown> = createIntGenerator(),
): NetworkHandler<JsonRpc.Request, JsonRpc.Response> => {
  const nextId = (id?: JsonRpc.Id): JsonRpc.Id => {
    if (id !== undefined) return id
    return idGenerator.next().value
  }

  return (context) => (request) => {
    const body = {
      params: undefined,
      ...request,
      id: nextId(request.id),
      jsonrpc: '2.0', // just required by protocol spec
    } satisfies Required<JsonRpc.Request>

    return backend(context)(
      new HttpRequest<Required<JsonRpc.Request>>({
        method: 'POST',
        url,
        body,
        responseType: 'json',
      }),
    ).pipe(
      takeBody<JsonRpc.Response>(),
    )
  }
}
