import { z } from "zod/v4";
import { ZService, ZServiceType } from "../zod.js";

export const ServiceDef = ZService.define({
  hello: z.function({
	  input: [z.string()],
	  output: z.string(),
  }),

  greet: z.function({
	  input: [z.string(), z.string()],
	  output: z.string(),
  }),

  sorry: z.function({
	  input: [z.string()],
	  output: z.string(),
  }),

  echoHeader: z.function({
	  input: [z.string()],
	  output: z.string()
        .or(z.string().array())
        .nullish()
  }),
})

export type Service = ZServiceType<typeof ServiceDef>

