import { BehaviorSubject, Subject, Observable, filter, distinctUntilChanged, share, of } from "rxjs"
import { Constructor, asString, getConstructor } from "./utils"
import { EventTransformer, concurrent } from "./EventTransformer"

type EmitValue<T> = (value: T) => void
type EventHander<E, T> = (event: E, emit: EmitValue<T>) => void | Promise<void>
type EventKey<E> = Constructor<E> | E

function getEventKey<E>(event: E): EventKey<E> {
  return getConstructor(event) ?? event
}

export abstract class Bloc<BlocEvent, State> {
  static transformer = concurrent()

  private readonly _eventTransformer = Bloc.transformer

  private readonly _eventInput$ = new Subject<BlocEvent>()
  private readonly _eventSource$ = this._eventInput$.asObservable().pipe(share())
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

  private emit(value: State): void {
    this._state$.next(value)
  }

  protected on<E extends BlocEvent>(
    event: EventKey<E>,
    handler: EventHander<E, State>,
    options: {
      transformer?: EventTransformer<E>
    } = {},
  ): void {
    const {
      transformer = this._eventTransformer as EventTransformer<E>
    } = options

    if (this._events.has(event)) {
      throw new Error(`on(${asString(event)}): handler cannot be registered more than once`)
    }

    this._events.add(event)

    transformer(
      this._eventSource$.pipe(
        filter((value): value is E => getEventKey(value) === event),
      ),
      (event) => {
        const handleEvent = async () => {
          try {
            await handler(event, (value) => this.emit(value))
          } catch (error) {
            this.addError(error)
            throw error
          }
        }
        handleEvent()
        return of(event)
      }
    ).subscribe()
  }

  add<E extends BlocEvent>(event: E): void {
    const eventKey = getEventKey(event)
    const isHandlerExists = this._events.has(eventKey)
    if (!isHandlerExists) {
      throw new Error(`add(${asString(event)}): handler is not registered and cannot be handled`)
    }
    try {
      this.onEvent(event)
      this._eventInput$.next(event)
    } catch (error) {
      this.addError(error)
      throw error
    }
  }

  protected onEvent<E extends BlocEvent>(event: E) {
    // TODO call bloc observer
  }

  protected addError(error: unknown): void {
    this.onError(error)
  }

  protected onError(error: unknown): void {
    // TODO call bloc observer
  }

  get isDisposed(): boolean {
    return this._state$.closed
  }

  dispose(): void {
    this._eventInput$.complete()
    this._eventInput$.unsubscribe()
    this._state$.complete()
    this._state$.unsubscribe()
  }

}
