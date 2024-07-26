/* eslint-disable @typescript-eslint/no-explicit-any */
import { map } from "rxjs"
import { NetworkStream } from "../core/NetworkStream"
import { JsonRpc } from "./JsonRpc"
import { NetworkContext } from "../core/NetworkContext"
import { NetworkClient } from "../core/NetworkClient"
import { NetworkHandler } from "../core/NetworkHandler"
import { createIntGenerator } from "./utils"

export class JsonRpcClient extends NetworkClient<JsonRpc.Request, JsonRpc.Response> {

  constructor(
    handler: NetworkHandler<JsonRpc.Request, JsonRpc.Response>,
    private readonly idGenerator: Generator<JsonRpc.Id> = createIntGenerator(),
  ) { super(handler) }

  private _getReuqestId(id?: JsonRpc.Id): JsonRpc.Id {
    if (id !== undefined) return id
    return this.idGenerator.next().value
  }

  protected override _buildRequest(request: JsonRpc.Request): Required<JsonRpc.Request> {
    return {
      params: undefined,
      ...request,
      id: this._getReuqestId(request.id),
      jsonrpc: '2.0',
    }
  }

  request<O>(
    request: JsonRpc.Request,
    context?: NetworkContext,
  ): NetworkStream<O> {
    return this.handle(request, context)
      .pipe(
        map((message) => {
          if (!JsonRpc.isMessage(message)) {
            throw new TypeError('response is not an JSONRPC message')
          }

          if (JsonRpc.isSuccess<O>(message)) {
            return message.result
          }

          if (JsonRpc.isError(message)) {
            throw message
          }

          throw new TypeError(`unknown JSONRPC response type: ${message}`)
        }),
      )
  }

  send<O>(method: string, params: unknown, context?: NetworkContext): NetworkStream<O>
  send<O>(method: string, params?: unknown, context?: NetworkContext): NetworkStream<O> {
    return this.request<O>({
      method,
      params,
    }, context)
  }
}
