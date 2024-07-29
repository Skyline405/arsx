# Reactive networking library

[![license](https://img.shields.io/badge/license-Apache--2.0-green)](https://github.com/Skyline405/arsx/blob/main/packages/network/LICENSE)
[![npm](https://badgen.net/npm/v/@arsx/net?icon=npm)](https://www.npmjs.com/package/@arsx/net)
[![downloads](https://badgen.net/npm/dt/@arsx/net?label=downloads)](https://www.npmjs.com/package/@arsx/net)

A reactive networking library.

## ATTENTION: API is unstable and may be changed in the future releases.

- [Network](#network)
  * [Installation](#installation)
  * [NetworkHandler](#networkhandler)
  * [NetworkInterceptor](#networkinterceptor)
- [Http](#http)
  * [Basic usage](#basic-usage)
  * [Providing base url](#providing-base-url)
  * [HttpHandler](#httphandler)
  * [HttpInterceptor](#httpinterceptor)
  * [Handy RxJs operators](#handy-rxjs-operators)
- [JsonRpc](#jsonrpc)
  * [Basic usage](#basic-usage)
  * [JsonRpcHandler](#jsonrpchandler)
  * [JsonRpcInterceptor](#jsonrpcinterceptor)
- [Roadmap](#roadmap)
- [TODO](#todo)

## Installation

```sh
npm install -S rxjs @arsx/net
```

## NetworkHandler

The `NetworkHandler` is the basic concept around which the entire architecture of the library is built.
It can be some endpoint representing backend or a pass-through handler that can intercept and modify the data flowing through it.

```ts
const lengthBackend = (): NetworkHandler<string, number> =>
  (context) => (input) => of(input).pipe(map(str => str.length))

const backend = lengthBackend()
backend(context)('hello').subscribe(observer) // emits: 5, complete
```

## NetworkInterceptor

Technically Interceptor is just a function taking a `NetworkHandler` and value, and return another `NetworkHandler`.

Interceptors are called in a chain from top to bottom, ending with backend.

There is `withInterceptors` function to help us to compose interceptors into a chain.

The `defineInterceptor` helper can be used to describe it as a function:

```ts
const logInterceptor = defineInterceptor((
  next,    // next handler in chain
  input,   // input value
  context, // NetworkContext
) => {
  console.log('input:', input)
  return next(input).pipe(
    tap((output) => console.log('output:', output))
  )
)

const chain = withInterceptors([
  logInteceptor,
], lengthBackend())

chain(context)('hello').subscribe(observer) // emits: 5, complete
```

## NetworkContext

Every `NetworkHandler` contain context which keeps in closure.
It can be accessed by interceptors.

```ts
// define context token with default value
const LOG_REQUEST = new NetworkContextToken<boolean>(() => true)

const logInterceptor = defineInterceptor((
  next, input, context,
) => {
  const shouldLog = context.get(LOG_REQUEST)

  if (!shouldLog) {
    console.log('input:', input)
  }
  
  return next(input)
)

const chain = withInterceptors([
  logInteceptor,
], lengthBackend())

// create context and set necessary values
const context = new NetworkContext()
context.set(LOG_REQUEST, false)

chain(context)('hello').subscribe(observer) // emits: 5, complete
```

# Http

## Basic usage

```ts
// create client with default http backend
const http = new HttpClient()
http.get('<url>').subscribe(observer)
http.post('<url>').subscribe(observer)
http.send('PUT', { body: 'data' })
  .subscribe(observer)
```

## Providing base url

```ts
// auto choose supporter api by platform
const http = new HttpClient(httpBackendFactory('http://example.com/some'))
// or use specifix api
const http = new HttpClient(xhrBackend('http://example.com/some'))
// or
const http = new HttpClient(fetchBackend('http://example.com/some'))

http.get('path').subscribe(observer)
```

## HttpHandler

Type `HttpHandler` is just an alias for `NetworkHandler<HttpRequest, HttpEvent>`.
In everything else it's the same `NetworkHandler`.

## HttpInterceptor

Type `HttpInterceptor` is just an alias for `NetworkInterceptor<HttpRequest, HttpEvent>`.
In everything else it's the same `NetworkInterceptor`.

Interceptors can be used whith any backends based on `NetworkHandler` concept.

```ts
// this interceptor compatible with any data type
const logInterceptor = (name: string) => {
  const tag = `[${name}]`
  return defineInteceptor((next, input, context) => {
    console.log(tag, '=>', request)
    return next(input).pipe(
      tap((response) => console.log(tag, '<=', response))
    )
  })
}

const http = new HttpClient(
  withInterceptor(
    logInterceptor('HTTP'),
  )(httpBackendFactory())
)

http.get('<url>').subscribe(observer)
```

## Handy RxJs operators

```ts
const http = new HttpClient()
http.handle(request)         // handle is just a client's handler delegate
  .pipe(takeResponse())      // just filter HttpResponse from http events
  .pipe(takeBody())          // apply takeResponse() and then pluck body field from response
  .pipe(catchHttpError(...)) // catch only http errors and skip others
  .subscribe(observer)
```

# JsonRpc

## Basic usage

```ts
const rpcBackend = jsonRpcHttpAdapter(httpBackendFactory('https://example.com/api/rpc'))
const rpc = new JsonRpcClient(rpcBackend)

rpc.send<string>('user.getRoleName', '<uuid>')
  .subscribe(observer) // emit: 'BasicRole'
```

## JsonRpcHandler

Type `JsonRpcHandler` is just an alias for `NetworkHandler<JsonRpcRequest, JsonRpcResponse>`.
In everything else it's the same `NetworkHandler`.

## JsonRpcInterceptor

Type `JsonRpcInterceptor` is just an alias for `NetworkInterceptor<JsonRpcRequest, JsonRpcResponse>`.
In everything else it's the same `NetworkInterceptor`.

Interceptors always be applied before backend.

```ts
const rpcBackend = withInterceptors([
  logInterceptor('RPC')
], jsonRpcHttpAdapter(httpBackendFactory()))
```

Also we can apply to http backend its own middlewares:

```ts
const httpBackend = withInterceptors([
  logInterceptor('HTTP')
], httpBackendFactory())

const rpcBackend = withInterceptors([
  logInterceptor('RPC')
], jsonRpcHttpAdapter(httpBackend))
```

# Roadmap

- [ ] Support WebSockets.
- [ ] Support Server-sent events.

# TODO

- [ ] Make detailed documentation.
