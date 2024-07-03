/* eslint-disable @typescript-eslint/no-explicit-any */
import { lastValueFrom, of } from "rxjs"
import { NetworkClient } from "../NetworkClient"
import { NetworkHandler } from "../NetworkHandler"
import { NetworkStream } from "../NetworkStream"
import { JsonRpc } from "./JsonRpc"
import { createIntGenerator } from "./utils"

export class JsonRpcClient implements NetworkClient {
  constructor(
    private handler: NetworkHandler<JsonRpc.Request, JsonRpc.Response>,
    private readonly idGenerator: Generator<unknown> = createIntGenerator(),
  ) {}

  send<O>(method: string): NetworkStream<O>
  send<O>(method: string, params: unknown): NetworkStream<O>
  send<O>(method: string, params?: unknown): NetworkStream<O> {
    return new NetworkStream((sub) => {
      const { value: id } = this.idGenerator.next()
      return this.handler(of({
        id,
        jsonrpc: '2.0',
        method,
        params,
      }))
        .subscribe({
          next: (message) => {
            if (JsonRpc.isError(message))
              return sub.error(message.error)

            if (JsonRpc.isSuccess<O>(message))
              return sub.next(message.result)

            throw new TypeError('unknown response type')
          },
          error: (err) => sub.error(err),
          complete: () => sub.complete()
        })
    })
  }

  notify(method: string): Promise<void>
  notify(method: string, params: unknown): Promise<void>
  notify(method: string, params?: unknown): Promise<void> {
    return lastValueFrom(this.send(method, params))
  }
}
