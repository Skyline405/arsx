import { Observable, concatMap, exhaustMap, mergeMap, switchMap } from "rxjs"

export type EventMapper<E> = (event: E) => Observable<E>
export type EventTransformer<E> = (
  event$: Observable<E>,
  mapper: EventMapper<E>,
) => Observable<E>

export const concurrent = <E>(): EventTransformer<E>  =>
  (event$, mapper) => event$.pipe(mergeMap(mapper))

export const droppable = <E>(): EventTransformer<E>  =>
  (event$, mapper) => event$.pipe(exhaustMap(mapper))

export const restartable = <E>(): EventTransformer<E>  =>
  (event$, mapper) => event$.pipe(switchMap(mapper))

export const sequential = <E>(): EventTransformer<E>  =>
  (event$, mapper) => event$.pipe(concatMap(mapper))
