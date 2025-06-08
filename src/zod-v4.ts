import { z } from "zod/v4";
import { Initor, initWith } from "./utils/function";
import { mapEntries } from "./utils/object";

export interface ZServiceSpec {
  [key: string]: {
    implement: (...args: any) => void;
  }
}

export interface ZServiceFactory<
    TCtx extends object,
    TImpl extends object,
    TExposed extends object
> {
    getBase(ctx: TCtx): TImpl
    (ctx: TCtx): TExposed
}

export type ZServiceImpl<T> =
  T extends ZService<infer TSpec>
    ? ZServiceSpecImpl<TSpec>
    : never

export type ZServiceSpecImpl<TSpec extends ZServiceSpec> = {
  [key in keyof TSpec]: Parameters<TSpec[key]["implement"]>[0]
}

export type ZServiceType<T> =
  T extends ZService<infer TSpec>
  ? {
    [key in keyof TSpec]: TSpec[key] extends z.core.$ZodFunction
    ? ReturnType<TSpec[key]["implementAsync"]>
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
    TCtx extends object,
    TImpl extends ZServiceSpecImpl<TSpec>
  >(init: Initor<[TCtx], TImpl>): ZServiceFactory<TCtx, TImpl, Pick<TImpl, keyof TSpec>> {
    return this.partiallyImplement<TCtx, TImpl>(init)
  }

  partiallyImplement<
    TCtx extends object,
    TImpl extends Partial<ZServiceSpecImpl<TSpec>>
  >(init: Initor<[TCtx], TImpl>) {
    const getBase = (ctx: TCtx): TImpl => initWith(init, [ctx]); 
    return Object.assign((ctx: TCtx) => {
      const spec = this.getSpec();
      const base = getBase(ctx);
      return mapEntries(spec, ([key, guard]) => {
        const fn = base[key];
        if (typeof fn !== "function") return null;
        return [key, guard.implementAsync(fn.bind(base))]
      }) as Pick<TImpl, keyof TSpec>
    }, { getBase })
  }
}

