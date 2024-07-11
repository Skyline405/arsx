export abstract class XhrFactory {
  protected XhrImpl: typeof XMLHttpRequest | undefined

  abstract load(): Promise<void>

  build(): XMLHttpRequest {
    if (this.XhrImpl == null)
      throw new Error(`"XMLHttpRequest" implementation not available`)
    return new this.XhrImpl()
  }

  static create(): XhrFactory {
    if ('XMLHttpRequest' in globalThis) {
      return new BrowserXhr()
    }

    throw new Error('XhrFactory is not specified for this platform')
  }
}

export class BrowserXhr extends XhrFactory {
  override async load(): Promise<void> {
    this.XhrImpl = globalThis.XMLHttpRequest
  }
}
