import { BlocChange } from "./BlocChange"

export class BlocTransition<BlocEvent, State> extends BlocChange<State> {
  constructor(
    currentState: State,
    nextState: State,
    readonly event: BlocEvent,
  ) {
    super(currentState, nextState)
  }

  override equals(target: unknown): target is this {
    return super.equals(target)
      && Object.is(this.event, target.event)
  }
}
