import { Bloc } from "../../Bloc"
import { BlocEventTransformer } from "../../BlocEventTransformer"
import { delay } from "../../utils"

export abstract class CounterEvent {
  __id = Symbol()
}
export class Add extends CounterEvent {
  constructor(readonly payload: number) { super() }
}
export class Increment extends CounterEvent { }
export class Reset extends CounterEvent {}
export class Multiply extends CounterEvent {
  constructor(readonly payload: number) { super() }
}

export class CounterBloc extends Bloc<CounterEvent, number> {
  constructor(init: number, transformer?: BlocEventTransformer<CounterEvent>) {
    super(init)

    this.on(Add, (event, emit) => {
      emit(this.state + event.payload)
    }, { transformer })

    this.on(Increment, (event, emit) => {
      emit(this.state + 1)
    })

    this.on(Multiply, async (event, emit) => {
      await delay(0)
      emit(this.state * event.payload)
    }, { transformer })
  }
}
