import { JsonRpc, JsonRpcClient } from '../public-api'
import { NetworkHandler } from '../../NetworkHandler'
import { map } from 'rxjs'

const fakeRpcHandler = (): NetworkHandler<JsonRpc.Request, JsonRpc.Response> =>
  (stream$) => stream$.pipe(
    map((req) => {
      switch (req.method) {
        case "add": return {
          jsonrpc: '2.0',
          id: req.id,
          result: `Response for: ${req.params}`,
        } satisfies JsonRpc.Response<string>
        default: return {
          jsonrpc: '2.0',
          id: req.id,
          error: {
            code: -1,
            message: 'Method ${0} not found',
            data: req.method,
          }
        }
      }
    }),
  )

describe('JsonRpcClient', () => {
  describe('request should be handled with', () => {
    it('success', (ctx) => new Promise<void>((done) => {
      const rpc = new JsonRpcClient(fakeRpcHandler())

      rpc.send<string>('add', 'world').subscribe({
        next: (value) => expect(value).toEqual('Response for: world'),
        error: (err) => console.error(err),
        complete: () => done(),
      })
    }))

    it('error', (ctx) => new Promise<void>((done) => {
      const rpc = new JsonRpcClient(fakeRpcHandler())

      rpc.send('not found', 'world').subscribe({
        next: (value) => console.log(value),
        error: (err) => {
          if (JsonRpc.isError(err)) {
            expect(err.error).toEqual({
              code: -1,
              message: 'Method ${0} not found',
              data: 'not found',
            } satisfies JsonRpc.ErrorObject<string>)
          }
          done()
        },
        complete: () => done(),
      })
    }))
  })
})
