export class HttpContextToken<T> {
  constructor(
    readonly defaultValue: () => T,
  ) {}
}

export class HttpContext {
  readonly #map = new Map<HttpContextToken<unknown>, unknown>()

  get<T>(token: HttpContextToken<T>): T {
    if (!this.#map.has(token))
      return token.defaultValue()
    return this.#map.get(token) as T
  }

  set<T>(token: HttpContextToken<T>, value: T): this {
    this.#map.set(token, value)
    return this
  }

  has<T>(token: HttpContextToken<T>): boolean {
    return this.#map.has(token)
  }

  delete<T>(token: HttpContextToken<T>): this {
    this.#map.delete(token)
    return this
  }

  keys(): IterableIterator<HttpContextToken<unknown>> {
    return this.#map.keys()
  }
}
