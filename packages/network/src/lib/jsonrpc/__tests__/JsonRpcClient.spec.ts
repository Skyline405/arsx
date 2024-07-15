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
        } satisfies JsonRpc.Success<string>
        default: return {
          jsonrpc: '2.0',
          id: req.id,
          error: {
            code: -1,
            message: 'Method ${0} not found',
            data: req.method,
          }
        } satisfies JsonRpc.Error<string>
      }
    }),
  )

describe('JsonRpcClient', () => {
  describe('request should be handled with', () => {
    it('success', () => new Promise<void>((done) => {
      const rpc = new JsonRpcClient(fakeRpcHandler())

      rpc.send<string>('add', 'world').subscribe({
        next: (value) => expect(value).toEqual({
          id: 1,
          jsonrpc: '2.0',
          result: 'Response for: world',
        } satisfies JsonRpc.Success<string>),
        error: (err) => console.error(err),
        complete: () => done(),
      })
    }))

    it('error', () => new Promise<void>((done) => {
      const rpc = new JsonRpcClient(fakeRpcHandler())

      rpc.send('not found', 'world').subscribe({
        next: (value) => console.log(value),
        error: (err) => {
          if (JsonRpc.isError(err)) {
            expect(err).toEqual({
              id: 1,
              jsonrpc: '2.0',
              error: {
                code: -1,
                message: 'Method ${0} not found',
                data: 'not found',
              }
            } satisfies JsonRpc.Error<string>)
          }
          done()
        },
        complete: () => done(),
      })
    }))
  })
})
