import { map } from "rxjs"
import { NetworkHandler } from "../NetworkHandler"
import { HttpRequest } from "../http/HttpRequest"
import { JsonRpc } from "./JsonRpc"
import { takeBody } from "../http/rxjs-interop"
import { HttpHandler, xhrBackend } from "../http/public-api"
import { JsonRpcRequest } from "./JsonRpcRequest"

export const jsonRpcHttpHandler = (
  url: string,
  backend: HttpHandler = xhrBackend(),
): NetworkHandler<JsonRpcRequest, JsonRpc.Response> => {
  return (input$) => backend(input$.pipe(
    map((input) => {
      const context = input.context
      input.context
      return new HttpRequest<JsonRpc.Request, JsonRpc.Response>({
        method: 'POST',
        url,
        body: input,
        context,
        responseType: 'json',
      })
    })
  )).pipe(
    takeBody<JsonRpc.Response>(),
  )
}
