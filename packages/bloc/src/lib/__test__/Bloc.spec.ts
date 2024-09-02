import { debounceTime, mergeMap, pipe } from 'rxjs'
import { Bloc } from '../Bloc'

import { CounterBloc, Add, Increment, Multiply, Reset, CounterEvent } from './mocks/CounterBloc.mock'
import { BlocEventTransformer } from '../BlocEventTransformer'

const defaultTransformer = Bloc.transformer

jest.useFakeTimers({ advanceTimers: true })

const delay = (time = 0) => jest.runAllTimersAsync()

describe('Bloc', () => {
  afterEach(() => {
    Bloc.transformer = defaultTransformer
  })

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

    it('should emit initial state', async () => {
      const emits: number[] = []
      const bloc = new CounterBloc(0)

      bloc.state$.subscribe((value) => emits.push(value))
      await delay(1)
      expect(emits).toEqual([0])
    })

    it('can be disposed', () => {
      const bloc = new CounterBloc(0)
      expect(bloc.isDisposed).toBe(false)
      expect(() => bloc.add(new Increment())).not.toThrow()
      bloc.dispose()
      expect(bloc.isDisposed).toBe(true)
      expect(() => bloc.add(new Increment())).toThrow()
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

  describe('using with classes', () => {
    it('should throw error if event not registered', async () => {
      const bloc = new CounterBloc(0)
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
        Bloc.transformer = (mapper) =>
          pipe(
            debounceTime(1),
            mergeMap(mapper),
          )

        const bloc = new CounterBloc(1)
        bloc.add(new Add(2))
        bloc.add(new Add(1))

        await delay(10)
        expect(bloc.state).toEqual(2)

        bloc.add(new Multiply(5))
        bloc.add(new Multiply(7))

        await delay(10)
        expect(bloc.state).toEqual(14)
      })

      it('should use custom transformer', async () => {
        const transformer: BlocEventTransformer<CounterEvent> = (mapper) =>
          pipe(
            debounceTime(1),
            mergeMap(mapper),
          )

        const bloc = new CounterBloc(1, transformer)
        bloc.add(new Add(2))
        bloc.add(new Add(1))

        await delay(10)
        expect(bloc.state).toEqual(2)

        bloc.add(new Multiply(5))
        bloc.add(new Multiply(7))

        await delay(10)
        expect(bloc.state).toEqual(14)
      })
    })
  })
})
