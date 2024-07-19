export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer
}

export function isBlob(value: unknown): value is Blob {
  // Blob is not defined in nodejs
  return typeof Blob !== 'undefined'
    && value instanceof Blob
}

export function isFormData(value: unknown): value is FormData {
  // FormData is not defined in nodejs
  return typeof FormData !== 'undefined'
    && value instanceof FormData
}

export function isUrlSearchParams(value: unknown): value is URLSearchParams {
  return typeof URLSearchParams !== 'undefined'
    && value instanceof URLSearchParams
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNull(value: unknown): value is null {
  return value === null
}

export function isObject(value: unknown): value is object {
  return !isNull(value)
    && value instanceof Object
    && !Array.isArray(value)
}

export function isPlainObject(value: unknown): value is object {
  return isObject(value)
    && Object.getPrototypeOf(value) === Object.prototype
}
