import { webSocket } from 'rxjs/webSocket'
import { NetworkStream } from "../NetworkStream"
import { NetworkHandler } from "../NetworkHandler"
import { of } from 'rxjs'

export const websocketBackend = <T, R>(url: string): NetworkHandler<T, R> =>
  (payload) => new NetworkStream((sub) => {
    const socket$ = webSocket<unknown>({ url })

    const socketSub = socket$.subscribe(sub as never)
    const channelSub = of(payload).subscribe(socket$)

    return () => {
      socket$.complete()
      socketSub.unsubscribe()
      channelSub.unsubscribe()
    }
  })
