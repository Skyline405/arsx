export type HttpResponseType =
  | 'json'
  | 'text'
  | 'blob'
  | 'arraybuffer'

export type HttpResponseBody =
  | ArrayBuffer
  | Blob
  // | FormData
  | object
  | string
  | null

const XSS_PREFIX = /^\)\]\}',?\n/

export function decodeResponseBody(
  body: Uint8Array,
  responseType: HttpResponseType,
  contentType?: string,
): HttpResponseBody {
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
