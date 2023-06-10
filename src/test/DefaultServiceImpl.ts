import { ServiceDef } from "./Service";

export const DefaultServiceImpl = ServiceDef.implement(() => ({
  hello(name: string) {
    return `Hello ${name}!`;
  },

  greet(hello: string, name = "world") {
    return `${hello} ${name}!`;
  },

  sorry(name: string): string {
    throw new Error(`Sorry ${name}.`);
  },

  echoHeader(name: string): string {
    throw new Error(`Not supported`);
  },
}));
