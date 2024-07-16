import { NetworkContext } from "./NetworkContext"
import { NetworkStream } from "./NetworkStream"

export type NetworkHandler<I, O> = (input: I) => NetworkStream<O>
export type NetworkHandlerBuilder<I, O> = (context: NetworkContext) => NetworkHandler<I, O>

export type NetworkMiddleware<I, O> = (next: NetworkHandlerBuilder<I, O>) => NetworkHandlerBuilder<I, O>

export type NetworkInterceptor<I, O> = (
  next: NetworkHandler<I, O>,
  input: I,
  context: NetworkContext,
) => NetworkStream<O>

export const defineMiddleware = <I, O>(
  intercept: NetworkInterceptor<I, O>
): NetworkMiddleware<I, O> =>
  (next) => (context) => (input) => intercept(next(context), input, context)

export const applyMiddleware = <I, O>(
  ...list: NetworkMiddleware<I, O>[]
) => (
  backend: NetworkHandlerBuilder<I, O>,
): NetworkHandlerBuilder<I, O> =>
  list.reduceRight((prev, next) => next(prev), backend)
