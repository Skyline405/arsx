export class NetworkContextToken<T> {
  constructor(
    readonly defaultValue: () => T,
  ) {}
}

export class NetworkContext {
  readonly #map = new Map<NetworkContextToken<unknown>, unknown>()

  get<T>(token: NetworkContextToken<T>): T {
    if (!this.#map.has(token))
      return token.defaultValue()
    return this.#map.get(token) as T
  }

  set<T>(token: NetworkContextToken<T>, value: T): this {
    this.#map.set(token, value)
    return this
  }

  has<T>(token: NetworkContextToken<T>): boolean {
    return this.#map.has(token)
  }

  delete<T>(token: NetworkContextToken<T>): this {
    this.#map.delete(token)
    return this
  }

  keys(): IterableIterator<NetworkContextToken<unknown>> {
    return this.#map.keys()
  }
}

export function createContext() {
  return new NetworkContext()
}

export function createContextToken<T>(defaultValue: () => T) {
  return new NetworkContextToken(defaultValue)
}
