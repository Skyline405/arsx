import { NetworkHandlerBuilder } from "../NetworkHandler"
import { HttpRequest } from "../http/HttpRequest"
import { JsonRpc } from "./JsonRpc"
import { takeBody } from "../http/rxjs-interop"
import { HttpHandler, xhrBackend } from "../http/public-api"

export const jsonRpcHttpHandler = (
  url: string,
  backend: HttpHandler = xhrBackend(),
): NetworkHandlerBuilder<JsonRpc.Request, JsonRpc.Response> =>
  (context) => (request) => {
    const body = {
      ...request,
      jsonrpc: '2.0', // just required by protocol spec
    } satisfies JsonRpc.Request & { readonly jsonrpc: '2.0' }
    return backend(context)(
      new HttpRequest<JsonRpc.Request, JsonRpc.Response>({
        method: 'POST',
        url,
        body,
        responseType: 'json',
      }),
    ).pipe(
      takeBody<JsonRpc.Response>(),
    )
  }
