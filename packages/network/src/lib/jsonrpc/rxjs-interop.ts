import {
  catchError,
  Observable,
  ObservableInput,
  ObservedValueOf,
  OperatorFunction,
  pipe,
  throwError,
} from "rxjs"
import { JsonRpc } from "./JsonRpc"

export function catchJsonRpcError<T, O extends ObservableInput<JsonRpc.Response>>(
  selector: (err: JsonRpc.ErrorObject<T>, caught: Observable<T>) => O
): OperatorFunction<T, T | ObservedValueOf<O>> {
  return pipe(
    catchError((error, caught) => {
      if (JsonRpc.isError<T>(error))
        return selector(error.error, caught)
      return throwError(() => error)
    })
  )
}
