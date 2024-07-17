import { NetworkContext } from "./NetworkContext"
import { NetworkStream } from "./NetworkStream"

export type NetworkHandler<I, O> = (input: I) => NetworkStream<O>
export type NetworkHandlerBuilder<I, O> =
  (context: NetworkContext) => NetworkHandler<I, O>

export type NetworkMiddleware<I, O> =
  (next: NetworkHandlerBuilder<I, O>) => NetworkHandlerBuilder<I, O>

export type NetworkInterceptor<I, O> = (
  next: NetworkHandler<I, O>,
  input: I,
  context: NetworkContext,
) => NetworkStream<O>

export const defineInterceptor = <I, O>(
  interceptor: NetworkInterceptor<I, O>
) => interceptor

// TODO: use curry function
const splitInterceptor = <I, O>(
  intercept: NetworkInterceptor<I, O>
): NetworkMiddleware<I, O> =>
  (next) => (context) => (input) =>
    intercept(next(context), input, context)

export const withInterceptors = <I, O>(
  list: NetworkInterceptor<I, O>[]
): NetworkMiddleware<I, O> => (
  backend: NetworkHandlerBuilder<I, O>,
): NetworkHandlerBuilder<I, O> =>
  list.reduceRight((handlerBuilder, interceptor) =>
    splitInterceptor(interceptor)(handlerBuilder), backend)
