import {
  catchError,
  filter,
  map,
  Observable,
  ObservableInput,
  ObservedValueOf,
  OperatorFunction,
  pipe,
  throwError,
} from "rxjs"
import { JsonRpc } from "./JsonRpc"

export function takeResult<T>(): OperatorFunction<JsonRpc.Success<T>, T> {
  return pipe(
    filter(JsonRpc.isSuccess),
    map(({ result }) => result),
  )
}

export function catchJsonRpcError<T, O extends ObservableInput<JsonRpc.Response>>(
  selector: (err: JsonRpc.Error<T>, caught: Observable<T>) => O
): OperatorFunction<T, T | ObservedValueOf<O>> {
  return pipe(
    catchError((error, caught) => {
      if (JsonRpc.isError<T>(error))
        return selector(error, caught)
      return throwError(() => error)
    })
  )
}
