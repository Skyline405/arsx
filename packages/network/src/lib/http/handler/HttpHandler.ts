import { NetworkHandlerBuilder, NetworkMiddleware, defineInterceptor } from "../../NetworkHandler"
import { HttpEvent } from "../HttpEvent"
import { HttpRequest } from "../HttpRequest"

export type HttpHandler = NetworkHandlerBuilder<HttpRequest, HttpEvent>
export type HttpBackend = HttpHandler
export type HttpInterceptor = NetworkMiddleware<HttpRequest, HttpEvent>

export const defineHttpInterceptor = defineInterceptor<HttpRequest, HttpEvent>
