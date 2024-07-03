import { NetworkStream } from "./NetworkStream"

export interface NetworkClient<I = unknown, O = unknown> {
  send<R extends O, T extends I>(data: T): NetworkStream<R>
}
