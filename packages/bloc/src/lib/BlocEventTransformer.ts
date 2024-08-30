import { Observable, concatMap, exhaustMap, mergeMap, switchMap } from "rxjs"

export type BlocEventMapper<E> = (event: E) => Observable<E>
export type BlocEventTransformer<E> = (
  event$: Observable<E>,
  mapper: BlocEventMapper<E>,
) => Observable<E>

export const concurrent = <E>(): BlocEventTransformer<E>  =>
  (event$, mapper) => event$.pipe(mergeMap(mapper))

export const droppable = <E>(): BlocEventTransformer<E>  =>
  (event$, mapper) => event$.pipe(exhaustMap(mapper))

export const restartable = <E>(): BlocEventTransformer<E>  =>
  (event$, mapper) => event$.pipe(switchMap(mapper))

export const sequential = <E>(): BlocEventTransformer<E>  =>
  (event$, mapper) => event$.pipe(concatMap(mapper))
