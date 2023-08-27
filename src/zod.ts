import { z } from "zod";

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
  ? {
    [key in keyof TSpec]: TSpec[key] extends z.ZodFunction<infer TArgs, infer TRes>
    ? z.infer<z.ZodFunction<TArgs, TRes>>
    : never
  }
  : never

export class ZService<TSpec extends ZServiceSpec> {

  static define<TSpec extends ZServiceSpec>(
    specSource: TSpec | (() => TSpec)
  ) {
    const getSpec = typeof specSource === "function"
      ? specSource
      : () => specSource;
    return new ZService(getSpec)
  }

  private constructor(public getSpec: () => TSpec) { }

  implement<
    TCtx extends {},
    TImpl extends ZServiceImpl<TSpec>
  >(factory: (ctx: TCtx) => TImpl) {
    return this.partiallyImplement<TCtx, TImpl>(factory)
  }

  partiallyImplement<
    TCtx extends {},
    TImpl extends Partial<ZServiceImpl<TSpec>>
  >(factory: (ctx: TCtx) => TImpl) {
    return (ctx: TCtx) => {
      const spec = this.getSpec()
      const entries = Object
        .entries(factory(ctx))
        .map(([key, fn]) => {
          return [key, (fn && spec[key]) ? spec[key].implement(fn) : fn]
        })
      return Object.fromEntries(entries) as TImpl
    }
  }
}
