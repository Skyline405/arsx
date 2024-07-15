import { map, tap } from 'rxjs'
import { HttpClient } from '../HttpClient'
import { HttpBackend, HttpResponse } from '../public-api'

const createHttpClient =
  (backend: HttpBackend) => new HttpClient(backend)

describe('HttpClient', () => {
  describe('should be able to send requests', () => {
    it('via "send" method', () => new Promise<void>((done) => {
      const onceCheckFn = jest.fn()

      const backend: HttpBackend = (request$) => request$.pipe(
        map((request) => new HttpResponse({
          url: request.url,
          body: request.body,
          headers: request.headers,
        }))
      )
      const http = createHttpClient(backend)
      http.send('POST', 'https://example.com/api', {
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
        )
        .subscribe({
          complete: done,
        })
    }))
  })
})
