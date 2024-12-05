import { z } from "zod";
import { Initor, initWith } from "./utils/function";
import { mapEntries } from "./utils/object";

export interface ZServiceSpec {
  [key: string]: {
    implement: (...args: any) => void;
  }
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
    TImpl extends ZServiceSpecImpl<TSpec>
  >(init: Initor<[TCtx], TImpl>) {
    return this.partiallyImplement<TCtx, TImpl>(init)
  }

  partiallyImplement<
    TCtx extends {},
    TImpl extends Partial<ZServiceSpecImpl<TSpec>>
  >(init: Initor<[TCtx], TImpl>) {
    return (ctx: TCtx) => {
      const spec = this.getSpec()
      const inst = initWith(init, [ctx]);
      return mapEntries(spec, ([key, guard]) => {
        const fn = inst[key];
        if (typeof fn !== "function") return null;
        return [key, guard.implement(fn.bind(inst))]
      }) as TImpl
    }
  }
}
