import { BehaviorSubject, Subject, Observable, filter, distinctUntilChanged, share, OperatorFunction } from "rxjs"
import { Constructor, asString, getConstructor } from "./utils"
import { BlocEventMapper, BlocEventTransformer, concurrent } from "./BlocEventTransformer"

type EmitValue<T> = (value: T) => void
type EventHander<E, T> = (event: E, emit: EmitValue<T>) => void | Promise<void>
type EventKey<E> = Constructor<E> | E

function getEventKey<E>(event: E): EventKey<E> {
  return getConstructor(event) ?? event
}

export abstract class Bloc<BlocEvent, State> {
  static transformer = concurrent()

  private readonly _eventTransformer = Bloc.transformer

  private readonly _event$ = new Subject<BlocEvent>()
  private readonly _state$: BehaviorSubject<State>
  private readonly _output$: Observable<State>

  private readonly _events = new Set<EventKey<BlocEvent>>()

  constructor(init: State) {
    this._state$ = new BehaviorSubject(init)
    this._output$ = this._state$.asObservable()
      .pipe(
        distinctUntilChanged(),
        share(),
      )
  }

  protected get event$() { return this._event$.asObservable() }

  get state$(): Observable<State> {
    return this._output$
  }

  get state(): State {
    return this._state$.getValue()
  }

  private emit(state: State): void {
    this._state$.next(state)
  }

  protected on<E extends BlocEvent>(
    event: EventKey<E>,
    handler: EventHander<E, State>,
    options: NoInfer<{
      transformer?: BlocEventTransformer<BlocEvent>
    }> = {},
  ): void {
    const {
      transformer = this._eventTransformer as BlocEventTransformer<E>
    } = options

    if (this._events.has(event)) {
      throw new Error(`on(${asString(event)}): handler cannot be registered more than once`)
    }

    this._events.add(event)

    this._event$.pipe(
      filter((value): value is E => getEventKey(value) === event),
      transformer(async (event) => {
        await handler(event, (state) => this.emit(state))
        return event
      }),
    ).subscribe()
  }

  add<E extends BlocEvent>(event: E): void {
    const eventKey = getEventKey(event)
    const isHandlerExists = this._events.has(eventKey)
    if (!isHandlerExists) {
      throw new Error(`add(${asString(event)}): handler is not registered and cannot be handled`)
    }
    this._event$.next(event)
  }

  get isDisposed(): boolean {
    return this._state$.closed
  }

  dispose(): void {
    this._event$.complete()
    this._event$.unsubscribe()
    this._state$.complete()
    this._state$.unsubscribe()
  }
}
