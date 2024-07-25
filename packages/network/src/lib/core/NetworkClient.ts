import { defer, share } from "rxjs"
import { NetworkContext } from "./NetworkContext"
import { NetworkHandler } from "./NetworkHandler"
import { NetworkStream } from "./NetworkStream"

export class NetworkClient<I, O> {
  constructor(
    private readonly handler: NetworkHandler<I, O>,
  ) {}

  protected _buildRequest(request: I): I {
    return request
  }

  handle(
    request: I,
    context: NetworkContext = new NetworkContext(),
  ): NetworkStream<O> {
    return defer(() => this.handler(context)(this._buildRequest(request)))
      .pipe(share())
  }
}
