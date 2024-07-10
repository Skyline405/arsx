# Network

<!-- [![npm version](https://img.shields.io/badge/npm%20package-0.0.0--alpha-brightgreen)](https://www.npmjs.com/package/@arsx/net) -->
[![license](https://img.shields.io/badge/license-Apache--2.0-green)]()
[![npm](https://badgen.net/npm/v/@arsx/net?icon=npm)](https://www.npmjs.com/package/@arsx/net)
[![downloads](https://badgen.net/npm/dt/@arsx/net?label=downloads)](https://www.npmjs.com/package/@arsx/net)
<!-- [![npm version](https://badgen.net/npm/v/@arsx/net?icon=npm)](https://www.npmjs.com/package/@arsx/net) -->
<!-- [![npm downloads](https://badgen.net/npm/dt/@arsx/net?label=downloads)](https://www.npmjs.com/package/vest) -->

A reactive networking library.

- [Network](#network)
  * [Installation](#installation)
  * [NetworkHandler](#networkhandler)
  * [NetworkMiddleware](#networkmiddleware)
- [Http](#http)
  * [Basic usage](#basic-usage)
  * [Providing base url](#providing-base-url)
  * [HttpHandler](#httphandler)
  * [HttpMiddleware](#httpmiddleware)
  * [Handy RxJs operators](#handy-rxjs-operators)
- [JsonRpc](#jsonrpc)
  * [Basic usage](#basic-usage-1)
  * [JsonRpcHandler](#jsonrpchandler)
  * [JsonRpcMiddleware](#jsonrpcmiddleware)
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
  (input$) => input$.pipe(map(str => str.length))

const backend = lengthBackend()
backend(of('hello', 'world!')).subscribe(observer) // emits: 5, 6, complete
```

## NetworkMiddleware

Middleware is just a function taking a `NetworkHandler` and returns another `NetworkHandler`.

Middlewares are called in a chain from top to bottom, ending with backend.

There is `applyMiddleware` function to help us to compose handlers into a chain.

The `defineMiddleware` helper can be used to describe it as a function:

```ts
const debugMiddleware = defineMiddleware<string, number>((
  next,             // next handler in chain
  input$,          // observable stream of input values
) => next(input$.pipe(
  tap((input) => console.log('input:', input))
)).pipe(
  tap((output) => console.log('output:', output))
)) // pass stream to next handler

const chain = applyMiddleware(
  debugMiddleware,
)(lengthBackend())

chain(of('hello', 'world!')).subscribe(observer) // emits: 5, 6, complete
```

# Http

## Basic usage

```ts
const http = new HttpClient()
http.get('<url>').subscribe(observer)
http.post('<url>').subscribe(observer)
http.send('PUT', { body: 'data' })
  .subscribe(observer)
```

## Providing base url

```ts
const http = new HttpClient(httpXhrBackend('http://example.com/some'))
http.get('path').subscribe(observer)
```

## HttpHandler

Type `HttpHandler` is just an alias for `NetworkHandler<HttpRequest, HttpEvent>`.
In everything else it's the same `NetworkHandler`.

## HttpMiddleware

Type `HttpMiddleware` is just an alias for `NetworkMiddleware<HttpRequest, HttpEvent>`.
In everything else it's the same `NetworkMiddleware`.

Middlewares can be used whith any backends based on `NetworkHandler` concept.

They should be applied before backend.

```ts
// This middleware compatible with any input and output
const logMiddleware = (name: string) =>
  defineMiddleware((next, input$) => {
    const tag = `[${name}]`
    return next(input$.pipe(
      tap((request) => console.log(tag, '=>', request))
    )).pipe(
      tap((response) => console.log(tag, '<=', response))
    )
  })

const http = new HttpClient(
  applyMiddleware(
    logMiddleware('HTTP'),
  )(httpXhrBackend())
)

http.get('<url>').subscribe(observer)
```

## Handy RxJs operators

```ts
const http = new HttpClient()
http.get('<url>')
  .pipe(takeResponse())      // just filter HttpResponse from http events
  .pipe(takeBody())          // apply takeResponse() and then pluck body field from response
  .pipe(catchHttpError(...)) // catch only http errors and skip others
  .subscribe(observer)
```

# JsonRpc

## Basic usage

```ts
const rpc = new JsonRpcClient(jsonRpcHttpHandler('https://example.com/api/rpc'))
// or
const rpc = new JsonRpcClient(
  jsonRpcHttpHandler('rpc', httpXhrBackend('https://example.com/api')),
)

rpc.send<string>('user.getRoleName', '<uuid>')
  .subscribe(observer) // emit: 'BasicRole'
```

## JsonRpcHandler

Type `JsonRpcHandler` is just an alias for `NetworkHandler<JsonRpcRequest, JsonRpcResponse>`.
In everything else it's the same `NetworkHandler`.

## JsonRpcMiddleware

Type `JsonRpcMiddleware` is just an alias for `NetworkMiddleware<JsonRpcRequest, JsonRpcResponse>`.
In everything else it's the same `NetworkMiddleware`.

Middlewares always be applied before backend.

```ts
const rpc = new JsonRpcClient(
  applyMiddleware(
    logMiddleware('RPC'),
  )(jsonRpcHttpHandler('https://example.com/api/rpc'))
)
```

Also we can apply to backend its own middlewares:

```ts
const rpc = new JsonRpcClient(
  jsonRpcHttpHandler('https://example.com/api/rpc',
    applyMiddleware(
      logMiddleware('HTTP')
    )(httpXhrBackend())
  ),
)
```

Or both:

```ts
const rpc = new JsonRpcClient(
  applyMiddleware(
    logMiddleware('RPC'),
  )(jsonRpcHttpHandler('https://example.com/api/rpc',
    applyMiddleware(
      logMiddleware('HTTP')
    )(httpXhrBackend())
  ),
)
```

# TODO

- [ ] Support batch requests for JsonRpc.
