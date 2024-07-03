import { EMPTY } from "rxjs"
import { NetworkHandler } from "../NetworkHandler"
import { NetworkStream } from "../NetworkStream"

export class SSEClient<T> extends NetworkStream<T> {
  constructor(
    private readonly handler: NetworkHandler<void, T>,
  ) {
    super((observer) => {
      return this.handler(EMPTY).subscribe(observer)
    })
  }
}
