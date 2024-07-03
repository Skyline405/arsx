import {
  pipe,
  filter,
  map,
  OperatorFunction,
  catchError,
  Observable,
  ObservableInput,
  ObservedValueOf,
  throwError,
} from "rxjs"
import { HttpEvent, HttpEventType } from "./HttpEvent"
import { HttpErrorResponse, HttpResponse } from "./HttpResponse"


function isResponseEvent<T>(value: HttpEvent<T>): value is HttpResponse<T> {
  return value.type === HttpEventType.Response
    && value instanceof HttpResponse
}

export function takeResponse<T>(): OperatorFunction<HttpEvent<T>, HttpResponse<T>> {
  return pipe(
    filter(isResponseEvent),
  )
}

export function takeBody<T>(): OperatorFunction<HttpEvent<T>, T> {
  return pipe(
    takeResponse<T>(),
    map(({ body }) => body),
  )
}

export function catchHttpError<T, O extends ObservableInput<any>>(
  selector: (err: HttpErrorResponse, caught: Observable<T>) => O
): OperatorFunction<T, T | ObservedValueOf<O>> {
  return pipe(
    catchError((error, caught) => {
      if (error instanceof HttpErrorResponse) {
        return selector(error, caught)
      }
      return throwError(() => error)
    })
  )
}
