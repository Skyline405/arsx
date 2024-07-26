/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetworkStream } from "../core/NetworkStream"
import { HttpEvent } from "./HttpEvent"
import { HttpMethod, HttpRequest, HttpRequestInit } from "./HttpRequest"
import { HttpResponse } from "./HttpResponse"
import { takeBody, takeResponse } from "./rxjs-interop"
import { NetworkClient } from "../core/NetworkClient"
import { HttpHandler, NetworkContext, httpBackendFactory } from "./public-api"

export type HttpRequestOptions<T> = Omit<
  HttpRequestInit<T>,
  | 'method'
  | 'url'
  | 'reportProgress'
>

export class HttpClient extends NetworkClient<HttpRequest, HttpEvent> {
  constructor(
    backend: HttpHandler = httpBackendFactory(),
  ) { super(backend) }

  request<O, I = any>(
    requestInit: HttpRequest<I> | HttpRequestInit<I>,
    context?: NetworkContext,
  ): NetworkStream<HttpResponse<O>> {
    const request = requestInit instanceof HttpRequest
      ? requestInit
      : new HttpRequest(requestInit)

    return this.handle(request, context)
      .pipe(
        takeResponse(),
      )
  }

  send<R, T = any>(
    method: HttpMethod,
    url: string,
    options?: HttpRequestOptions<T>
  ): NetworkStream<R>
  send<R, T = any>(
    method: string,
    url: string,
    options?: HttpRequestOptions<T>
  ): NetworkStream<R> {
    const request = new HttpRequest<any>({
      ...options,
      method: method,
      url,
    })

    return this.request<R, T>(request, options?.context)
      .pipe(
        takeResponse(),
        takeBody(),
      )
  }

  get<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<R> {
    return this.send('GET', url, options)
  }

  head<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<R> {
    return this.send('HEAD', url, options)
  }

  delete<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<R> {
    return this.send('DELETE', url, options)
  }

  options<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<R> {
    return this.send('OPTIONS', url, options)
  }

  post<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<R> {
    return this.send('POST', url, options)
  }

  put<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<R> {
    return this.send('PUT', url, options)
  }

  patch<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<R> {
    return this.send('PATCH', url, options)
  }
}
