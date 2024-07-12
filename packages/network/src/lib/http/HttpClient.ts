/* eslint-disable @typescript-eslint/no-explicit-any */
import { of } from "rxjs"
import { NetworkStream } from "../NetworkStream"
import { HttpHandler } from "./handler/HttpHandler"
import { httpXhrBackend } from "./handler/HttpXhrBackend"
import { HttpEvent } from "./HttpEvent"
import { HttpMethod, HttpRequest, HttpRequestInit } from "./HttpRequest"
import { HttpResponse } from "./HttpResponse"
import { takeResponse } from "./rxjs-interop"

export type HttpRequestOptions<T> = Omit<HttpRequestInit<T>, 'method' | 'url'>

export class HttpClient {
  constructor(
    private readonly handler: HttpHandler = httpXhrBackend()
  ) {}

  request<R, T = any>(request: HttpRequest<T, R>): NetworkStream<HttpEvent<R>> {
    return this.handler(of(request))
  }

  send<R, T = any>(
    method: HttpMethod,
    url: string,
    options?: HttpRequestOptions<T>
  ): NetworkStream<HttpResponse<R>>
  send<R, T = any>(
    method: string,
    url: string,
    options?: HttpRequestOptions<T>
  ): NetworkStream<HttpResponse<R>> {
    const request = new HttpRequest<any, R>({
      ...options,
      method: method,
      url,
    })

    return this.request(request)
      .pipe(
        takeResponse(),
      )
  }

  get<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<HttpResponse<R>> {
    return this.send('GET', url, options)
  }

  head<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<HttpResponse<R>> {
    return this.send('HEAD', url, options)
  }

  delete<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<HttpResponse<R>> {
    return this.send('DELETE', url, options)
  }

  options<R>(url: string, options?: HttpRequestOptions<undefined>): NetworkStream<HttpResponse<R>> {
    return this.send('OPTIONS', url, options)
  }

  post<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<HttpResponse<R>> {
    return this.send('POST', url, options)
  }

  put<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<HttpResponse<R>> {
    return this.send('PUT', url, options)
  }

  patch<R, T = any>(url: string, options?: HttpRequestOptions<T>): NetworkStream<HttpResponse<R>> {
    return this.send('PATCH', url, options)
  }
}
