export interface ZServiceSpec {
  [key: string]: {
    implement: (...args: any) => void;
  }
}

export type ZServiceImpl<TSpec extends ZServiceSpec> = {
  [key in keyof TSpec]: Parameters<TSpec[key]["implement"]>[0]
}

export type ZServiceType<T> =
  T extends ZService<infer TSpec>
    ? ZServiceImpl<TSpec>
    : never

export class ZService<TSpec extends ZServiceSpec> {

  static define<TSpec extends ZServiceSpec>(spec: TSpec) {
    return new ZService(spec)
  }

  private constructor(public spec: TSpec) {}

  implement<TCtx extends {}, TImpl extends ZServiceImpl<TSpec>>(factory: (ctx: TCtx) => TImpl) {
    return this.partiallyImplement<TCtx, TImpl>(factory)
  }

  partiallyImplement<TCtx extends {}, TImpl extends Partial<ZServiceImpl<TSpec>>>(factory: (ctx: TCtx) => TImpl) {
    return (ctx: TCtx) => {
      return Object.fromEntries(Object
        .entries(factory(ctx))
        .map(([key, fn]) => {
          return [key, fn ? this.spec[key]?.implement(fn) : undefined]
        })) as TImpl 
    }
  }
}