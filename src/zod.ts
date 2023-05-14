import * as z from "zod";

export interface ZServiceSpec {
  [key: string]: z.ZodFunction<z.AnyZodTuple, z.ZodTypeAny>
}

export type ZServiceImpl<TSpec extends ZServiceSpec> = {
  [key in keyof TSpec]: Parameters<TSpec[key]["implement"]>[0]
}

export class ZService<TSpec extends ZServiceSpec> {
  static define<TSpec extends ZServiceSpec>(spec: TSpec) {
    return new ZService(spec)
  }

  private constructor(public spec: TSpec) {}

  implement<TCtx extends {}>(factory: (ctx: TCtx) => ZServiceImpl<TSpec>) {
    return this.partiallyImplement<TCtx, ZServiceImpl<TSpec>>(factory)
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
