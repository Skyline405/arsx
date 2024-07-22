import { NetworkContext } from "./NetworkContext"
import { NetworkStream } from "./NetworkStream"

export type NetworkHandlerDelegate<I, O> = (input: I) => NetworkStream<O>
export type NetworkHandler<I, O> =
  (context: NetworkContext) => NetworkHandlerDelegate<I, O>

// TODO: comeup with new name of this type
export type NetworkMiddleware<I, O> =
  (next: NetworkHandler<I, O>) => NetworkHandler<I, O>

export type NetworkInterceptor<I, O> = (
  next: NetworkHandlerDelegate<I, O>,
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
  list: NetworkInterceptor<I, O>[],
  backend: NetworkHandler<I, O>,
): NetworkHandler<I, O> =>
  list.reduceRight((handlerBuilder, interceptor) =>
    splitInterceptor(interceptor)(handlerBuilder), backend)
