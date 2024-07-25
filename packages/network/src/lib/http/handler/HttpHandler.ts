import { NetworkHandler, NetworkInterceptor, defineInterceptor } from "../../core/NetworkHandler"
import { HttpEvent } from "../HttpEvent"
import { HttpRequest } from "../HttpRequest"

export type HttpHandler = NetworkHandler<HttpRequest, HttpEvent>
export type HttpInterceptor = NetworkInterceptor<HttpRequest, HttpEvent>
export type HttpBackendFactory = (baseUrl?: string) => HttpHandler

export const defineHttpInterceptor = defineInterceptor<HttpRequest, HttpEvent>
