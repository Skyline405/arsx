import { NetworkContext } from "./NetworkContext"
import { NetworkStream } from "./NetworkStream"

export type NetworkHandlerDelegate<I, O> = (input: I) => NetworkStream<O>
export type NetworkHandler<I, O> =
  (context: NetworkContext) => NetworkHandlerDelegate<I, O>

// TODO: comeup with new name of this type
export type NetworkMiddleware<
  A extends NetworkHandler<any, any>,
  B extends NetworkHandler<any, any> = A
> = (next: B) => A

export type NetworkInterceptor<I, O> = (
  next: NetworkHandlerDelegate<I, O>,
  input: I,
  context: NetworkContext,
) => NetworkStream<O>

// TODO: use curry function
const splitInterceptor = <I, O>(
  intercept: NetworkInterceptor<I, O>
): NetworkMiddleware<NetworkHandler<I, O>> =>
  (next) => (context) => (input) =>
    intercept(next(context), input, context)

export const defineInterceptor = <I, O>(
  interceptor: NetworkInterceptor<I, O>
): NetworkMiddleware<NetworkHandler<I, O>> =>
  splitInterceptor(interceptor)

export const withInterceptors = <I, O>(
  list: NetworkMiddleware<NetworkHandler<I, O>>[],
  backend: NetworkHandler<I, O>,
): NetworkHandler<I, O> =>
  list.reduceRight((handler, intercept) =>
    intercept(handler), backend)
