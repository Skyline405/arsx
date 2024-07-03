/* eslint-disable @typescript-eslint/no-explicit-any */
import { of } from "rxjs"
import { NetworkClient } from "../NetworkClient"
import { NetworkStream } from "../NetworkStream"
import { HttpHandler } from "./handler/HttpHandler"
import { httpXhrBackend } from "./handler/HttpXhrBackend"
import { HttpEvent } from "./HttpEvent"
import { HttpMethod, HttpRequest, HttpRequestInit } from "./HttpRequest"
import { HttpResponse } from "./HttpResponse"

export type HttpRequestOptions<T> = Omit<HttpRequestInit<T>, 'method' | 'url'>

export class HttpClient implements NetworkClient<HttpRequest, HttpResponse> {
  constructor(
    private readonly handler: HttpHandler = httpXhrBackend()
  ) {}

  send<R, T = any>(request: HttpRequest<T, R>): NetworkStream<HttpEvent<R>>
  send<R, T = any>(method: HttpMethod, url: string, options?: HttpRequestOptions<T>): NetworkStream<HttpEvent<R>>
  send<R, T = any>(method: string, url: string, options?: HttpRequestOptions<T>): NetworkStream<HttpEvent<R>>
  send<R, T = any>(request: string | HttpRequest<T, R>, url?: string, options?: HttpRequestOptions<T>): NetworkStream<HttpEvent<unknown>> {
    if (typeof request === 'string') {
      if (url == null) throw new Error('"url" argument is not specified')

      request = new HttpRequest<any, R>({
        ...options,
        method: request,
        url,
      })
    }

    return this.handler(of(request))
  }

  get<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<HttpEvent<R>> {
    return this.send('GET', url, options)
  }

  head<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<HttpEvent<R>> {
    return this.send('HEAD', url, options)
  }

  delete<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<HttpEvent<R>> {
    return this.send('DELETE', url, options)
  }

  options<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<HttpEvent<R>> {
    return this.send('OPTIONS', url, options)
  }

  post<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<HttpEvent<R>> {
    return this.send('POST', url, options)
  }

  put<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<HttpEvent<R>> {
    return this.send('PUT', url, options)
  }

  patch<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<HttpEvent<R>> {
    return this.send('PATCH', url, options)
  }
}
