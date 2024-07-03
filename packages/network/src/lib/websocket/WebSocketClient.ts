import { Observable, Subject } from "rxjs"
import { NetworkHandler } from "../NetworkHandler"

export class WebSocketClient<T, R = T> extends Observable<R> {
  private readonly message$ = new Subject<T>()

  constructor(
    private readonly handler: NetworkHandler<T, R>,
  ) {
    super((observer) => {
      const sub = this.handler(this.message$.asObservable())
        .subscribe(observer)
      return () => sub.unsubscribe()
    })
  }

  send(message: T): void {
    this.message$.next(message)
  }
}
