import { map } from "rxjs"
import { NetworkHandler } from "../NetworkHandler"
import { HttpMethod, HttpRequest } from "../http/HttpRequest"
import { JsonRpc } from "./JsonRpc"
import { takeBody } from "../http/rxjs-interop"
import { HttpHandler } from "../http/public-api"

type JsonRpcHttpBackendOptions = {
  method: HttpMethod,
  url?: string,
}

const defaultOptions: JsonRpcHttpBackendOptions = {
  method: 'POST',
}

export const jsonRpcHttpBackend = (
  backend: HttpHandler,
  options?: JsonRpcHttpBackendOptions,
): NetworkHandler<JsonRpc.Request, JsonRpc.Response> => {
  const opt = Object.assign({}, defaultOptions, options)
  return (stream$) => backend(stream$.pipe(
    map((body) => new HttpRequest<JsonRpc.Request, JsonRpc.Response>({
      method: opt.method,
      url: opt.url ?? '',
      body,
      responseType: 'json',
    }))
  )).pipe(
    takeBody(),
  )
}
