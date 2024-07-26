import { fetchBackend } from "./FetchBackend"
import { HttpBackendFactory } from "./HttpHandler"

export const httpBackendFactory = ((baseUrl?: string, ...args) => {
  const url = baseUrl ?? typeof location !== 'undefined'
    ? location.href : undefined

  if (typeof fetch !== 'undefined') return fetchBackend(url, ...args)
  if (typeof XMLHttpRequest !== 'undefined') return fetchBackend(url, ...args)

  throw new Error(`No supported http backend found`)
}) satisfies HttpBackendFactory
