import { BehaviorSubject, Subject, Observable, filter, distinctUntilChanged, share } from "rxjs"
import { Constructor, asString, getConstructor } from "./utils"

type EmitValue<T> = (value: T) => void
type EventHander<E, T> = (event: E, emit: EmitValue<T>) => void | Promise<void>
type EventKey<E> = Constructor<E> | E

function getEventKey<E>(event: E): EventKey<E> {
  return getConstructor(event) ?? event
}

export abstract class Bloc<BlocEvent, State> {
  private readonly _eventBus$ = new Subject<BlocEvent>()
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

  get state$(): Observable<State> {
    return this._output$
  }

  get state(): State {
    return this._state$.getValue()
  }

  get isDisposed(): boolean {
    return this._state$.closed
  }

  private emit(value: State): void {
    this._state$.next(value)
  }

  protected on<E extends BlocEvent>(
    event: EventKey<E>,
    handler: EventHander<E, State>,
  ): void {
    if (this._events.has(event)) {
      throw new Error(`on(${asString(event)}): handler cannot be registered more than once`)
    }

    this._events.add(event)

    this._eventBus$
      .pipe(
        filter((value): value is E => getEventKey(value) === event),
      )
      .subscribe({
        next: (event) => handler(event, (value) => this.emit(value)),
      })
  }

  add<E extends BlocEvent>(event: E): void {
    const eventKey = getEventKey(event)
    const isHandlerExists = this._events.has(eventKey)
    if (!isHandlerExists) {
      throw new Error(`add(${asString(event)}): handler is not registered and cannot be handled`)
    }
    this._eventBus$.next(event)
  }

  dispose(): void {
    this._eventBus$.complete()
    this._eventBus$.unsubscribe()
    this._state$.complete()
    this._state$.unsubscribe()
  }

}
