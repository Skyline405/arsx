import { finalize, map, of, tap } from 'rxjs'
import { HttpClient } from '../HttpClient'
import { HttpBackend, HttpResponse } from '../public-api'

const createHttpClient =
  (backend: HttpBackend) => new HttpClient(backend)

const echoBackend: HttpBackend = (context) => (request) =>
  of(request).pipe(
    map((request) => new HttpResponse({
      url: request.url,
      body: request.body,
      headers: request.headers,
    }))
  )

describe('HttpClient', () => {
  describe('should be able to send requests', () => {
    it('via "request" method', () => new Promise<void>((done) => {
      const onceCheckFn = jest.fn()

      const http = createHttpClient(echoBackend)
      http.request({
        method: 'POST',
        url: 'https://example.com/api',
        body: { some: 'body' },
        headers: [['X-TraceID', 'trace-id']],
        responseType: 'json',
      }).pipe(
          tap((response) => {
            onceCheckFn()
            expect(onceCheckFn).toHaveBeenCalledTimes(1)
            expect(response).toBeInstanceOf(HttpResponse)
            expect(response.ok).toBeTruthy()
            expect(response.body).toEqual({ some: 'body' })
            expect(response.url).toEqual('https://example.com/api')
          }),
          finalize(done),
        ).subscribe()
    }))

    it('via "send" method', () => new Promise<void>((done) => {
      const http = createHttpClient(echoBackend)
      http.send('POST', 'https://example.com/api', { body: 'some' }).pipe(
          tap((response) => {
            expect(response).not.toBeInstanceOf(HttpResponse)
            expect(response).toEqual('some')
          }),
          finalize(done),
        ).subscribe()
    }))
  })
})
