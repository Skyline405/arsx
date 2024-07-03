/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpHeaders } from '../HttpHeaders'

const headersRecord = {
  a: ['a1', 'a2'],
  b: ['b1', 'b2'],
  c: [],
}

describe('class HttpHeaders', () => {
  let headers: HttpHeaders = null as unknown as HttpHeaders

  beforeEach(() => {
    headers = new HttpHeaders(headersRecord)
  })

  describe('should be created via constructor', () => {
    it('with no arguments', () => {
      expect(new HttpHeaders()).toBeInstanceOf(HttpHeaders)
      expect(new HttpHeaders(null)).toBeInstanceOf(HttpHeaders)
    })

    it('with unexpected argument', () => {
      expect(new HttpHeaders(Symbol() as any)).toBeInstanceOf(HttpHeaders)
    })

    it('with array of pairs of strings', () => {
      const instance = new HttpHeaders([
        ['a', '1'], ['b', '2'], ['b', '3'],
      ])
      expect(instance.get('a')).toEqual(['1'])
      expect(instance.get('b')).toEqual(['2', '3'])
    })

    it('with another HttpHeaders', () => {
      const instance = new HttpHeaders(new HttpHeaders(headersRecord))
      expect(instance.get('a')).toEqual(headersRecord['a'])
      expect(instance.get('b')).toEqual(headersRecord['b'])
      expect(instance.get('c')).toEqual(headersRecord['c'])
    })
  })

  describe('append() method', () => {
    it('should add value to the values list', () => {
      const instance = new HttpHeaders()
      instance.append('a', 'a1')
      expect(instance.get('a')).toEqual(['a1'])

      instance.append('a', 'a2')
      expect(instance.get('a')).toEqual(['a1', 'a2'])

      instance.append('a', ['a2', 'a1']) // try to add existing values
      expect(instance.get('a')).toEqual(['a1', 'a2', 'a2', 'a1'])
    })

    it('should add value from comma separated string', () => {
      headers.append('Accept', 'application/json, text/html; charset=utf-8')
      expect(headers.get('Accept')).toEqual(['application/json', 'text/html; charset=utf-8'])
    })

  })

  describe('has() method', () => {
    it('should return true when key is exists', () => {
      expect(headers.has('a')).toBeTruthy()
    })

    it('should return false when key is not exists', () => {
      expect(headers.has('nothing')).toBeFalsy()
    })

    it('should return true when value is exists', () => {
      expect(headers.has('a', 'a1')).toBeTruthy()
    })

    it('should return false when value is not exists', () => {
      expect(headers.has('a', 'nothing')).toBeFalsy()
    })

    it('should not throws when value type unexpected', () => {
      expect(headers.has('a', Symbol() as any)).toBeFalsy()
    })
  })

  describe('set() method', () => {
    it('should add values', () => {
      headers.set('a', ['some', 'values'])
      expect(headers.get('a')).toEqual(['some', 'values'])
    })

    it('should override values', () => {
      headers.set('a', 'some')
      headers.set('a', ['values'])
      expect(headers.get('a')).toEqual(['values'])
    })
  })

  describe('get() method', () => {
    it('should return value by case insensetive key', () => {
      expect(headers.get('A')).toEqual(['a1', 'a2'])
    })
  })
})
