import { z } from "zod";
import { ZService, ZServiceType } from "../zod";

export const ServiceDef = ZService.define({
  hello: z.function()
    .args(z.string())
    .returns(z.string()),

  greet: z.function()
    .args(z.string(), z.string())
    .returns(z.string()),

  sorry: z.function()
    .args(z.string())
    .returns(z.string()),

  echoHeader: z.function()
    .args(z.string())
    .returns(
      z.string()
        .or(z.string().array())
        .nullish()
    ),
})

export type Service = ZServiceType<typeof ServiceDef>

