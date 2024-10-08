/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Constructor<T> {
  new (...args: any[]): T
}

export interface Abstract<T> extends NewableFunction {
  prototype: T
}

export type Prototype<T> = {
  [P in keyof T]: T[P]
} & {
  constructor: NewableFunction
}

export function isConstructor<T>(target: unknown): target is Constructor<T> {
  if (typeof target !== 'function') return false
  return 'prototype' in target
}

export function isPrototype<T>(target: unknown): target is Prototype<T> {
  return target instanceof Object
      && target.constructor != null
}

export function getConstructor<T>(target: T): Constructor<T> | undefined {
  if (!isPrototype(target)) return
  return target.constructor as Constructor<T>
}

export function constructorName(
  value: Constructor<unknown> | Prototype<unknown>
): string {
  if (isConstructor(value)) return value.name
  return value.constructor.name
}

export function asString<T>(value: T): string {
  if (value == null) return String(value)
  if (typeof value === 'symbol') return value.toString()
  if (typeof value === 'function') return value.toString()
  if (isConstructor(value)) return `class ${constructorName(value)}`
  if (isPrototype(value)) return constructorName(value)
  return JSON.stringify(value)
}

export const delay = (time = 0) => new Promise((resolve) => setTimeout(resolve, time))
