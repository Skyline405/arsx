import { JsonRpc, JsonRpcClient } from '../public-api'
import { NetworkHandlerBuilder } from '../../core/NetworkHandler'
import { map, of } from 'rxjs'

const fakeRpcHandler = (): NetworkHandlerBuilder<JsonRpc.Request, JsonRpc.Response> =>
  (context) => (request) =>
    of(request).pipe(
      map((req) => {
        switch (req.method) {
          case "add": return {
            id: 1,
            result: `Response for: ${req.params}`,
          } satisfies JsonRpc.Success<string>
          default: return {
            id: 1,
            error: {
              code: -1,
              message: 'Method ${0} not found',
              data: req.method,
            }
          } satisfies JsonRpc.Error<string>
        }
      })
    )

describe('JsonRpcClient', () => {
  describe('request should be handled', () => {
    describe('via "request" method', () => {
      it('success', () => new Promise<void>((done, fail) => {
        const rpc = new JsonRpcClient(fakeRpcHandler())

        rpc.request({
          method: 'add',
          params: 'world',
        }).subscribe({
          next: (value) => {
            expect(value).toEqual('Response for: world')
          },
          error: (err) => {
            console.error(err)
            fail()
          },
          complete: () => done(),
        })
      }))

      it('error', () => new Promise<void>((done, fail) => {
        const rpc = new JsonRpcClient(fakeRpcHandler())

        rpc.request({
          method: 'not found',
          params: 'world'
        }).subscribe({
          next: (value) => {
            console.log(value),
            fail()
          },
          error: (err) => {
            if (JsonRpc.isError(err)) {
              expect(err).toEqual({
                error: {
                  code: -1,
                  message: 'Method ${0} not found',
                  data: 'not found',
                },
                id: 1
              } satisfies JsonRpc.Error<string>)
              done()
            }
            fail(err)
          },
          complete: () => done(),
        })
      }))
    })
  })
})
