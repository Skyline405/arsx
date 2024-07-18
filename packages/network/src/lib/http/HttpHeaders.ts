import { isObject } from "../../utils/typeof"

export type HttpHeadersRecord = Record<string, string>
export type HttpHeadersArray = Array<[string, string]>

export type HttpHeadersInit =
  | HttpHeadersArray
  | HttpHeadersRecord
  | HttpHeaders
  | Headers
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
  readonly #headers = new Map<HeadersKey, string[]>()

  constructor(init?: HttpHeadersInit | null) {
    if (init != null) {
      if (init instanceof HttpHeaders) {
        init.forEach((values, key) => {
          this.append(key, values)
        })
      } else if (typeof Headers !== 'undefined' && init instanceof Headers) {
        init.forEach((values, key) => {
          this.append(key, values)
        })
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.append(key, value)
        })
      } else if (isObject(init)) {
        this.appendFromRecord(init as HttpHeadersRecord)
      } else if (typeof init === 'string') {
        this.appendFromString(init)
      }
    }
  }

  get(name: string): string[] {
    const key = normalizeKey(name)
    const list = this.#headers.get(key) ?? []
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
    this.#headers.set(key, list)
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

  appendFromRecord(init: HttpHeadersRecord): void {
    Object.keys(init).forEach((key) => {
      if (!Object.hasOwn(init, key)) return
      const value = init[key]
      this.append(key, value)
    })
  }

  delete(name: string, value?: string | string[]): void {
    const key = normalizeKey(name)

    if (value != null) {
      const values = Array.isArray(value) ? value : [value]
      const list = this.get(key)
      const result = list.filter((val) => !values.includes(val))
      if (result.length) this.#headers.set(key, result)
      else this.#headers.delete(key)
    }

    this.#headers.delete(key)
  }

  has(key: string, value?: string): boolean {
    const list = this.get(key)
    if (value == null) return list.length > 0
    return list.includes(value)
  }

  forEach(
    callback: (values: string[], name: string, parent: HttpHeaders) => void,
  ): void {
    this.#headers.forEach((values, name) => callback([...values], name, this))
  }

  keys(): string[] {
    return [...this.#headers.keys()]
  }

  toArray(): HttpHeadersArray {
    const result: HttpHeadersArray = []
    this.forEach((values, key) => {
      result.push([key, values.join(',')])
    })
    return result
  }

  toRecord(): HttpHeadersRecord {
    const result: HttpHeadersRecord = {}
    this.forEach((values, key) => {
      result[key] = values.join(',')
    })
    return result
  }
}
