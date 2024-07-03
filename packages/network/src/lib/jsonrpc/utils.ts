export function* createIntGenerator(from = 1) {
  while(from < Infinity) {
    yield from++
  }
}
