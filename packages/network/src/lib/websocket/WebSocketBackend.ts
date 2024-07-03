import { webSocket } from 'rxjs/webSocket'
import { NetworkStream } from "../NetworkStream"
import { NetworkHandler } from "../NetworkHandler"

export const websocketBackend = <T, R>(url: string): NetworkHandler<T, R> =>
  (message$) => new NetworkStream((sub) => {
    const socket$ = webSocket<unknown>({ url })

    const socketSub = socket$.subscribe(sub as never)
    const channelSub = message$.subscribe(socket$)

    return () => {
      socket$.complete()
      socketSub.unsubscribe()
      channelSub.unsubscribe()
    }
  })
