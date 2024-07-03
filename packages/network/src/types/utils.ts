// FIXME: figure out why *.d.ts not includes into the builded code
export type PartialIf<T, R> =
  T extends undefined ? Partial<R>
  : R
