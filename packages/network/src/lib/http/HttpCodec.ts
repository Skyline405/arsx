import { isArrayBuffer, isBlob, isFormData, isUrlSearchParams, isString, isNull } from "../../utils/typeof"

export type HttpResponseType =
  | 'json'
  | 'text'
  | 'blob'
  | 'arraybuffer'

export type HttpResponseBody =
  | ArrayBuffer
  | Blob
  | object
  | string
  | null

const XSS_PREFIX = /^\)\]\}',?\n/

// ENCODER

export function encodeBody(body: unknown): XMLHttpRequestBodyInit | null {
  const isAutoEncodableType = [
    isArrayBuffer,
    isBlob,
    isFormData,
    isUrlSearchParams,
    isString,
    isNull,
  ].some((typeGuard) => typeGuard(body))

  if (isAutoEncodableType) return body as XMLHttpRequestBodyInit

  if (typeof body === 'object' || typeof body === 'boolean') {
    return JSON.stringify(body)
  }

  return String(body)
}

export function detectContentType(body: unknown): string | undefined {
  const isBinaryType = [
    isArrayBuffer,
    isFormData,
    isNull,
  ].some((typeGuard) => typeGuard(body))

  if (isBinaryType) return undefined

  if (isString(body)) return 'text/plain'

  if (typeof body === 'object'
    || typeof body === 'number'
    || typeof body === 'boolean')
    return 'application/json'

  return undefined
}

// DECODER

export function decodeResponseBody(
  body: Uint8Array | null,
  responseType: HttpResponseType,
  contentType?: string,
): HttpResponseBody {
  if (body == null) return body
  switch (responseType) {
    case 'text': return decodeText(body)
    case 'json': return decodeJson(body)
    case 'arraybuffer': return body.buffer
    case 'blob': return new Blob([body], { type: contentType })
  }
}

export function decodeText(value: ArrayBuffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(value)
}

export function decodeJson<T extends object>(value: ArrayBuffer): T | null {
  const text = stripXssPrefix(decodeText(value))
  if (text === '') return null
  return JSON.parse(text)
}

export function stripXssPrefix(value: string): string {
  return value.replace(XSS_PREFIX, '')
}
