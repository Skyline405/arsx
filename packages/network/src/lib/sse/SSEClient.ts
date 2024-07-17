import { NetworkHandlerDelegate } from "../core/NetworkHandler"
import { NetworkStream } from "../core/NetworkStream"

export class SSEClient<T> extends NetworkStream<T> {
  constructor(
    private readonly handler: NetworkHandlerDelegate<void, T>,
  ) {
    super((observer) => {
      return this.handler().subscribe(observer)
    })
  }
}
