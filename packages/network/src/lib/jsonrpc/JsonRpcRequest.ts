import { NetworkContext } from '../NetworkContext'
import { JsonRpc } from './JsonRpc'

export interface JsonRpcRequestInit extends Omit<JsonRpc.Request, 'jsonrpc'> {
  readonly context?: NetworkContext
}

export class JsonRpcRequest implements JsonRpcRequestInit {
  readonly id: JsonRpc.Id
  readonly params: unknown
  readonly method: string
  readonly jsonrpc = '2.0'
  readonly context: NetworkContext

  constructor(init: JsonRpcRequestInit) {
    this.id = init.id
    this.params = init.params
    this.method = init.method
    this.context = init.context ?? new NetworkContext()
  }

  clone(update: Partial<JsonRpcRequestInit>): JsonRpcRequest {
    return new JsonRpcRequest({
      id: update.id ?? this.id,
      method: update.method ?? this.method,
      params: 'params' in update ? update.params : this.params,
      context: update.context ?? this.context,
    })
  }

  toJSON(): JsonRpc.Request {
    return {
      id: this.id,
      jsonrpc: '2.0',
      method: this.method,
      params: this.params,
    }
  }
}
