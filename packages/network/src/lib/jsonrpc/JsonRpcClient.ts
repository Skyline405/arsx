/* eslint-disable @typescript-eslint/no-explicit-any */
import { map } from "rxjs"
import { NetworkStream } from "../core/NetworkStream"
import { JsonRpc } from "./JsonRpc"
import { NetworkContext } from "../core/NetworkContext"
import { NetworkClient } from "../core/NetworkClient"

export class JsonRpcClient extends NetworkClient<JsonRpc.Request, JsonRpc.Response> {
  request<O>(
    request: JsonRpc.Request,
    context?: NetworkContext,
  ): NetworkStream<O> {
    return this.handle(request, context)
      .pipe(
        map((message) => {
          if (JsonRpc.isSuccess<O>(message)) {
            return message.result
          }

          if (JsonRpc.isError(message)) {
            throw message
          }

          throw {
            error: {
              code: 0,
              message: 'Unknown Error',
            },
            id: null,
          } satisfies JsonRpc.Error
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

  // notify(method: string, params: unknown, context?: NetworkContext): Promise<void>
  // async notify(method: string, params?: unknown, context?: NetworkContext): Promise<void> {
  //   await lastValueFrom(this.request({
  //     method,
  //     params,
  //   }, context))
  // }
}
