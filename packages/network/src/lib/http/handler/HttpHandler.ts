import { NetworkHandlerBuilder, NetworkMiddleware } from "../../NetworkHandler"
import { HttpEvent } from "../HttpEvent"
import { HttpRequest } from "../HttpRequest"

export type HttpHandler = NetworkHandlerBuilder<HttpRequest, HttpEvent>
export type HttpBackend = HttpHandler
export type HttpMiddleware = NetworkMiddleware<HttpRequest, HttpEvent>
