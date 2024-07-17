export type PartialIf<T, R> =
  T extends undefined ? Partial<R>
  : R

export type IfExtends<T, D, Then, Else> =
  T extends D ? Then
  : Else
