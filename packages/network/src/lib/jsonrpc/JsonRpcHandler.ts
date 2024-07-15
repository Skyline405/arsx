import { map } from "rxjs"
import { NetworkHandler } from "../NetworkHandler"
import { HttpRequest } from "../http/HttpRequest"
import { JsonRpc } from "./JsonRpc"
import { takeBody } from "../http/rxjs-interop"
import { HttpHandler, xhrBackend } from "../http/public-api"

export const jsonRpcHttpHandler = (
  url: string,
  backend: HttpHandler = xhrBackend(),
): NetworkHandler<JsonRpc.Request, JsonRpc.Response> => {
  return (message$) => backend(message$.pipe(
    map((body) => new HttpRequest<JsonRpc.Request, JsonRpc.Response>({
      method: 'POST',
      url,
      body,
      responseType: 'json',
    }))
  )).pipe(
    takeBody<JsonRpc.Response>(),
  )
}
