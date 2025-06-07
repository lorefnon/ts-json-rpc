import { Service, ServiceDef } from "./Service";

/**
 * A `Service` implementation with access to the request headers.
 */
export const RequestAwareServiceImpl = ServiceDef.implement((ctx: {
  headers?: Record<string, string | string[] | undefined>
}) => ({
  hello(name: string) {
    return `Hello ${name}!`;
  },

  greet(hello: string, name = "world") {
    return `${hello} ${name}!`;
  },

  sorry(name: string): string {
    throw new Error(`Sorry ${name}.`);
  },

  echoHeader(name: string) {
    return ctx.headers?.[name.toLowerCase()];
  }
}))
