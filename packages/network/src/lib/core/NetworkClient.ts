import { share } from "rxjs"
import { NetworkContext } from "./NetworkContext"
import { NetworkHandler } from "./NetworkHandler"
import { NetworkStream } from "./NetworkStream"

export class NetworkClient<I, O> {
  constructor(
    private readonly handler: NetworkHandler<I, O>,
  ) {}

  handle(
    request: I,
    context: NetworkContext = new NetworkContext(),
  ): NetworkStream<O> {
    return this.handler(context)(request)
      .pipe(share())
  }
}
