export abstract class XhrFactory {
  protected XhrImpl: typeof XMLHttpRequest | undefined

  abstract load(): Promise<void>

  build(): XMLHttpRequest {
    if (this.XhrImpl == null)
      throw new Error('"XMLHttpRequest" implementation not awailable')
    return new this.XhrImpl()
  }

  static create(): XhrFactory {
    if ('XMLHttpRequest' in globalThis) {
      return new BrowserXhr()
    } else if ('process' in globalThis) {
      return new NodejsXhr()
    }

    throw new Error('XhrFactory is not specified for this platform')
  }
}

export class BrowserXhr extends XhrFactory {
  async load(): Promise<void> {
    this.XhrImpl = globalThis.XMLHttpRequest
  }
}

export class NodejsXhr extends XhrFactory {
  override async load() {
    const xhr2 = await import('xhr2')
    this.XhrImpl = xhr2.XMLHttpRequest as any
  }
}
