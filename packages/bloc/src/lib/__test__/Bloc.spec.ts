import { Bloc } from '../Bloc'

const delay = (time = 0) => new Promise((resolve) => setTimeout(resolve, time))

describe('Bloc', () => {
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
      const bloc = new CounterBloc()

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
    class Increment extends CounterEvent {}
    class Reset extends CounterEvent {}
    class Multiply extends CounterEvent {
      constructor(readonly payload: number) { super() }
    }

    class CounterBloc extends Bloc<CounterEvent, number> {
      constructor(init = 0) {
        super(init)

        this.on(Increment, (event, emit) => {
          emit(this.state + 1)
        })

        this.on(Multiply, async (event, emit) => {
          await delay(0)
          emit(this.state * event.payload)
        })

        // check for resctrictions
        // this.on(new Multiply(2), (event, emit) => {
        //   emit(this.state * event.payload)
        // })
      }
    }

    it('should throw error if event not registered', async () => {
      const bloc = new CounterBloc()
      expect(() => bloc.add(new Reset())).toThrow()
    })

    it('should process sync events', async () => {
      const bloc = new CounterBloc()

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
  })
})
