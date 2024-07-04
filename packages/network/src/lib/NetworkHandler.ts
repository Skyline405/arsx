import { NetworkStream } from "./NetworkStream"

export type NetworkHandler<I, O> = (stream$: NetworkStream<I>) => NetworkStream<O>

export type NetworkMiddleware<I, O> = (next: NetworkHandler<I, O>) => NetworkHandler<I, O>

export type NetworkInterceptor<I, O> = (
  next: NetworkHandler<I, O>,
  stream$: NetworkStream<I>,
) => NetworkStream<O>

export const defineHandler = <I, O>(handler: NetworkHandler<I, O>) => handler

export const defineMiddleware = <I, O>(
  intercept: NetworkInterceptor<I, O>
): NetworkMiddleware<I, O> =>
  (next) => (stream$) => intercept(next, stream$)

export const applyMiddleware = <I, O>(
  ...list: NetworkMiddleware<I, O>[]
) => (
  backend: NetworkHandler<I, O>,
): NetworkHandler<I, O> => (
  list.reduceRight((prev, next) => next(prev), backend)
)
