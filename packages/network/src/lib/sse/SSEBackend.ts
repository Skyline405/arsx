import { NetworkStream } from "../core/NetworkStream"
import { NetworkHandlerDelegate } from "../core/NetworkHandler"

export const sseBackend = <T>(url: string, withCredentials?: boolean): NetworkHandlerDelegate<void, T> =>
  () => new NetworkStream((sub) => {
    const sse = new EventSource(url, {
      withCredentials,
    })

    const onMessage = (e: MessageEvent<T>) => {
      sub.next(e.data)
    }

    const onError = (e: Event) => {
      sub.error(e)
    }

    sse.addEventListener('message', onMessage)
    sse.addEventListener('error', onError)

    return () => {
      sub.complete()
      if (sse.readyState !== sse.CLOSED) {
        sse.close()
      }

      sse.removeEventListener('message', onMessage)
      sse.removeEventListener('error', onError)
    }
  })
