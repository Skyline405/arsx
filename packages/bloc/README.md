# BLoC

Simple BLoC implementation based on rxjs (inspired by BLoC for Dart).

## Basic usage

```ts
abstract class CounterEvent {}
class Add extends CounterEvent {
  constructor(readonly payload: number) {
    super()
  }
}
class Increment extends CounterEvent { }
class Reset extends CounterEvent {}

class CounterBloc extends Bloc<CounterEvent, number> {
  constructor(init: number) {
    super(init)

    this.on(Add, (event, emit) => {
      emit(this.state + event.payload)
    })

    this.on(Increment, (event, emit) => {
      emit(this.state + 1)
    })

    this.on(Reset, async (event, emit) => {
      await delay(0)
      emit(init)
    })
  }
}

const counter = new CounterBloc(0)

counter.state$.subscribe(observer) // emits: 0, 1, 0

console.log(bloc.state) // output: 0
counter.add(new Increment())
console.log(bloc.state) // output: 1

counter.add(new Reset())
console.log(bloc.state) // output: 1
await delay(1)
console.log(bloc.state) // output: 0

counter.dispose() // free resources
```

