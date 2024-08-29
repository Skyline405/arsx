import { concatMap, debounceTime, mergeMap } from 'rxjs'
import { Bloc } from '../Bloc'
import { delay } from '../utils'

describe('Bloc', () => {
  describe('basic usage', () => {
    it('should not register event handler more than once', () => {
      class MyBloc extends Bloc<string, number> {
        constructor() {
          super(0)
          this.on('one', (event, emit) => emit(1))
          this.on('one', (event, emit) => emit(1))
        }
      }

      expect(() => new MyBloc()).toThrow()
    })
  })

  describe('error handling and producing', () => {
    it('should produce and handle errors', async () => {
      class MyBloc extends Bloc<string, number> {
        constructor() {
          super(0)
          this.on('inc', (event, emit) => {
            this.addError(new Error('increment error!'))
            emit(this.state + 1)
          })
        }

        protected override onError<E extends Error>(error: E): void {
          super.onError(error)
          this.handleError(error)
        }

        handleError(error: Error): void {/* handle error */}
      }

      const bloc = new MyBloc()
      const handlerMethod = jest.spyOn(bloc, 'handleError')

      bloc.add('inc')
      bloc.add('inc')

      // await delay(0)

      expect(handlerMethod).toHaveBeenCalledTimes(2)
      expect(handlerMethod).toHaveBeenCalledWith(new Error('increment error!'))
    })
  })

  // WITH ENUMS

  describe('using wit enums', () => {
    enum CounterEvent {
      Increment,
      Double,
      Reset,
    }

    class CounterBloc extends Bloc<CounterEvent, number> {
      constructor(init = 0) {
        super(init)

        this.on(CounterEvent.Increment, (event, emit) => {
          emit(this.state + 1)
        })

        this.on(CounterEvent.Double, async (event, emit) => {
          await delay(0)
          emit(this.state * 2)
        })
      }
    }

    it('should throw error if event not registered', async () => {
      const bloc = new CounterBloc()
      expect(() => bloc.add(CounterEvent.Reset)).toThrow()
    })

    it('should process sync events', async () => {
      const bloc = new CounterBloc(0)

      expect(bloc.state).toEqual(0)
      bloc.add(CounterEvent.Increment)
      expect(bloc.state).toEqual(1)
    })

    it('should process async events', async () => {
      const bloc = new CounterBloc(2)

      bloc.add(CounterEvent.Double)
      expect(bloc.state).toEqual(2)
      await delay(0)
      expect(bloc.state).toEqual(4)
    })
  })

  // WITH CLASSES

  describe('using wit classes', () => {
    abstract class CounterEvent {
      __id = Symbol()
    }
    class Add extends CounterEvent {
      constructor(readonly payload: number) { super() }
    }
    class Increment extends CounterEvent { }
    class Reset extends CounterEvent {}
    class Multiply extends CounterEvent {
      constructor(readonly payload: number) { super() }
    }

    class CounterBloc extends Bloc<CounterEvent, number> {
      constructor(init = 0) {
        super(init)

        this.on(Add, (event, emit) => {
          emit(this.state + event.payload)
        })

        this.on(Increment, (event, emit) => {
          emit(this.state + 1)
        })

        this.on(Multiply, async (event, emit) => {
          await delay(0)
          emit(this.state * event.payload)
        })
      }
    }

    it('should throw error if event not registered', async () => {
      const bloc = new CounterBloc()
      expect(() => bloc.add(new Reset())).toThrow()
    })

    it('should process sync events', async () => {
      const bloc = new CounterBloc(0)

      expect(bloc.state).toEqual(0)
      bloc.add(new Increment())
      expect(bloc.state).toEqual(1)
    })

    it('should process async events', async () => {
      const bloc = new CounterBloc(2)
      bloc.add(new Multiply(5))
      expect(bloc.state).toEqual(2)
      await delay(0)
      expect(bloc.state).toEqual(10)
    })

    it('should not emit next state when closed', () => {
      const bloc = new CounterBloc(0)
      bloc.dispose()
      expect(bloc.isDisposed).toBeTruthy()
      expect(() => bloc.add(new Increment())).toThrow()
    })

    it('should not be disposed more than once', () => {
      const bloc = new CounterBloc(0)
      bloc.dispose()
      expect(bloc.isDisposed).toBeTruthy()
      expect(() => bloc.dispose()).toThrow()
    })

    describe('transformers usage', () => {
      it('should use default transformer', async () => {
        const bloc = new CounterBloc(1)
        bloc.add(new Multiply(5))
        bloc.add(new Add(2))

        expect(bloc.state).toEqual(3)
        await delay(0)
        expect(bloc.state).toEqual(15)
      })

      it('should use global custom transformer', async () => {
        Bloc.transformer = (event$, mapper) =>
          event$.pipe(
            debounceTime(1),
            mergeMap(mapper),
          )

        const bloc = new CounterBloc(1)
        bloc.add(new Add(2))
        bloc.add(new Add(1))
        bloc.add(new Multiply(5))
        bloc.add(new Multiply(7))

        await delay(0)
        expect(bloc.state).toEqual(2)

        await delay(10)
        expect(bloc.state).toEqual(14)

      })
    })
  })
})
