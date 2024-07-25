import { fetchBackend } from "./FetchBackend"
import { HttpBackendFactory } from "./HttpHandler"

export const httpBackendFactory = ((...args) => {
  if (typeof fetch !== 'undefined') return fetchBackend(...args)
  if (typeof XMLHttpRequest !== 'undefined') return fetchBackend(...args)
  throw new Error(`No supported http backend found`)
}) satisfies HttpBackendFactory
