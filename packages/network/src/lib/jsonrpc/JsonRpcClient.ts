/* eslint-disable @typescript-eslint/no-explicit-any */
import { lastValueFrom, map } from "rxjs"
import { NetworkHandlerBuilder } from "../NetworkHandler"
import { NetworkStream } from "../NetworkStream"
import { JsonRpc } from "./JsonRpc"
import { createIntGenerator } from "./utils"
import { NetworkContext } from "../NetworkContext"
import { takeResult } from "./rxjs-interop"

export class JsonRpcClient {
  constructor(
    private handler: NetworkHandlerBuilder<JsonRpc.Request, JsonRpc.Response>,
    private readonly idGenerator: Generator<unknown> = createIntGenerator(),
  ) {}

  request<O>(
    request: JsonRpc.Request,
    context: NetworkContext = new NetworkContext(),
  ): NetworkStream<O> {
    return this.handler(context)(request)
      .pipe(
        map((message) => {
          if (JsonRpc.isSuccess<O>(message)) {
            return message
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
        takeResult(),
      )
  }

  send<O>(method: string, params: unknown, context?: NetworkContext): NetworkStream<O>
  send<O>(method: string, params?: unknown, context?: NetworkContext): NetworkStream<O> {
    const { value: id } = this.idGenerator.next()
    return this.request<O>({
      id,
      method,
      params,
    }, context)
  }

  notify(method: string, params: unknown): Promise<void>
  async notify(method: string, params?: unknown): Promise<void> {
    await lastValueFrom(this.request({
      id: null,
      method,
      params,
    }))
  }
}
