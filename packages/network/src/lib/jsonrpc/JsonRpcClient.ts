/* eslint-disable @typescript-eslint/no-explicit-any */
import { lastValueFrom, map, of } from "rxjs"
import { NetworkHandler } from "../NetworkHandler"
import { NetworkStream } from "../NetworkStream"
import { JsonRpc } from "./JsonRpc"
import { createIntGenerator } from "./utils"
import { NetworkContext } from "../NetworkContext"
import { JsonRpcRequest, JsonRpcRequestInit } from "./JsonRpcRequest"
import { takeResult } from "./rxjs-interop"

export interface JsonRpcRequestOptions {
  context?: NetworkContext
}

export class JsonRpcClient {
  constructor(
    private handler: NetworkHandler<JsonRpcRequest, JsonRpc.Response>,
    private readonly idGenerator: Generator<unknown> = createIntGenerator(),
  ) {}

  request<O>(
    requestInit: JsonRpcRequest | JsonRpcRequestInit
  ): NetworkStream<O> {
    const request = requestInit instanceof JsonRpcRequest
      ? requestInit
      : new JsonRpcRequest(requestInit)

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
        }),
        takeResult(),
      )
  }

  send<O>(method: string): NetworkStream<O>
  send<O>(method: string, params: unknown): NetworkStream<O>
  send<O>(method: string, params?: unknown): NetworkStream<O> {
    const { value: id } = this.idGenerator.next()
    return this.request<O>({
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
