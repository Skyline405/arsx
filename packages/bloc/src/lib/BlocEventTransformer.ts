import { ObservableInput, OperatorFunction, concatMap, exhaustMap, mergeMap, pipe, switchMap } from "rxjs"

export type BlocEventMapper<E> = (event: E) => ObservableInput<E>
export type BlocEventTransformer<T> = <E extends T>(
  mapper: BlocEventMapper<E>,
) => OperatorFunction<E, E>

export const concurrent = <E>(): BlocEventTransformer<E>  =>
  (mapper) => pipe(mergeMap(mapper))

export const droppable = <E>(): BlocEventTransformer<E>  =>
  (mapper) => pipe(exhaustMap(mapper))

export const restartable = <E>(): BlocEventTransformer<E>  =>
  (mapper) => pipe(switchMap(mapper))

export const sequential = <E>(): BlocEventTransformer<E>  =>
  (mapper) => pipe(concatMap(mapper))
