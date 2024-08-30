export class BlocChange<State> {
  constructor(
    readonly currentState: State,
    readonly nextState: State,
  ) {}

  equals(target: unknown): target is this {
    if (!(target instanceof BlocChange)) return false
    if (Object.is(this, target)) return true
    return Object.is(this.currentState, target.currentState)
        && Object.is(this.nextState, target.nextState)
  }
}
