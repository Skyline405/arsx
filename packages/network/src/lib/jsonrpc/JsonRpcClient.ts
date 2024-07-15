/* eslint-disable @typescript-eslint/no-explicit-any */
import { lastValueFrom, map, of } from "rxjs"
import { NetworkHandler } from "../NetworkHandler"
import { NetworkStream } from "../NetworkStream"
import { JsonRpc } from "./JsonRpc"
import { createIntGenerator } from "./utils"

export class JsonRpcClient {
  constructor(
    private handler: NetworkHandler<JsonRpc.Request, JsonRpc.Response>,
    private readonly idGenerator: Generator<unknown> = createIntGenerator(),
  ) {}

  request<O>(request: JsonRpc.Request): NetworkStream<JsonRpc.Success<O>> {
    return this.handler(of(request))
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
              code: JsonRpc.ErrorCode.InternalError,
              message: 'Internal Error',
            },
            id: null,
            jsonrpc: '2.0',
          } satisfies JsonRpc.Error
        })
      )
  }

  send<O>(method: string): NetworkStream<JsonRpc.Success<O>>
  send<O>(method: string, params: unknown): NetworkStream<JsonRpc.Success<O>>
  send<O>(method: string, params?: unknown): NetworkStream<JsonRpc.Success<O>> {
    const { value: id } = this.idGenerator.next()
    return this.request({
      id,
      jsonrpc: '2.0',
      method,
      params,
    })
  }

  notify(method: string): Promise<void>
  notify(method: string, params: unknown): Promise<void>
  async notify(method: string, params?: unknown): Promise<void> {
    await lastValueFrom(this.request({
      id: null,
      jsonrpc: '2.0',
      method,
      params,
    }))
  }
}
