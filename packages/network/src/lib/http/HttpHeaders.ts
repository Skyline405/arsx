export type HttpHeadersInit =
  | Array<[string, string]>
  | Record<string, string | string[]>
  | HttpHeaders
  | string

type HeadersKey = string & {
  [k: symbol]: symbol
}

function normalizeKey(key: string): HeadersKey {
  return key
    .trim()
    .toLocaleLowerCase() as HeadersKey
}

export class HttpHeaders {
  readonly #map = new Map<HeadersKey, string[]>()

  constructor(init?: HttpHeadersInit | null) {
    if (init != null) {
      if (init instanceof HttpHeaders) {
        init.forEach((values, key) => {
          this.append(key, values)
        })
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.append(key, value)
        })
      } else if (typeof init === 'object') {
        Object.keys(init).forEach((key) => {
          if (!Object.hasOwn(init, key)) return
          const value = init[key]
          this.append(key, value)
        })
      } else if (typeof init === 'string') {
        this.appendFromString(init)
      }
    }
  }

  get(name: string): string[] {
    const key = normalizeKey(name)
    const list = this.#map.get(key) ?? []
    return [...list]
  }

  set(name: string, value: string | string[]): void {
    this.delete(name)
    this.append(name, value)
  }

  append(name: string, value: string | string[]): void {
    const key = normalizeKey(name)
    const list = this.get(key)
    const values = Array.isArray(value) ? value : value.split(',')
    values.forEach((val) => list.push(String(val.trim())))
    this.#map.set(key, list)
  }

  appendFromString(value: string): void {
    const pairs = value.split('\n')
    pairs.forEach((val) => {
      if (!val) return
      if (!val.includes(':')) return
      const [name, value] = val.split(':')
      this.append(name, value)
    })
  }

  delete(name: string, value?: string | string[]): void {
    const key = normalizeKey(name)

    if (value != null) {
      const values = Array.isArray(value) ? value : [value]
      const list = this.get(key)
      const result = list.filter((val) => !values.includes(val))
      if (result.length) this.#map.set(key, result)
      else this.#map.delete(key)
    }

    this.#map.delete(key)
  }

  has(key: string, value?: string): boolean {
    const list = this.get(key)
    if (value == null) return list.length > 0
    return list.includes(value)
  }

  forEach(
    callback: (values: string[], name: string, parent: HttpHeaders) => void,
  ): void {
    this.#map.forEach((values, name) => callback([...values], name, this))
  }
}
