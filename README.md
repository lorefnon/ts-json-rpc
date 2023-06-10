# ts-json-rpc

Lightweight [JSON-RPC](https://www.jsonrpc.org/specification) solution for TypeScript projects

## Features:

- 👩‍🔧 Service definition through Zod-based contracts
- 📜 JSON-RPC 2.0 protocol
- 🕵️ Full IDE autocompletion
- 🪶 Tiny footprint (< 1kB)
- 🌎 Support for Deno and edge runtimes
- 🚫 No code generation step

## Basic Usage

Define a shared service contract and export the type of service:

```ts
import { z } from "zod";
import type { ZServiceType } from "@lorefnon/ts-json-rpc/lib/zod";
import { ZService } from "@lorefnon/ts-json-rpc/lib/zod";

export const MyServiceDef = ZService.define({

  hello: z.function()
    .args(z.string())
    .returns(z.string().promise()),

  // More methods here ...
});

export type MyService = ZServiceType<typeof MyServiceDef>
// { hello: (arg: string) => Promise<string>, ... }
```

Define an implementation of this service:

```ts
export const DefaultServiceImpl = ServiceDef.implement(() => ({

  async hello(name) { // name is inferred as string
    return `Hello ${name}!`;
  },

  // Implement other methods...
}));
```
Create a server with a route to handle the API requests:

```ts
import express from "express";
import { rpcHandler } from "@lorefnon/ts-json-rpc/lib/express";

const app = express();
app.use(express.json());
app.post("/api", rpcHandler(DefaultServiceImpl()));
app.listen(3000);
```

> **Note**
> You can also use @lorefnon/ts-json-rpc in servers other than Express.
> Check out to docs below for [examples](#support-for-other-runtimes).

On the client-side, import the shared type and create a typed `rpcClient` with it:

```ts
// client/index.ts

import { rpcClient, HttpPostTransport } from "@lorefnon/ts-json-rpc/lib/client";

// Import the type (not the implementation!)
import type { MyService } from "../server/myService";

// Create a typed client:
const client = rpcClient<MyService>({
  transport: new HttpPostTransport({
    url: "http://localhost:3000/api"
  })
});

// Call a remote method:
console.log(await client.hello("world"));
```

That's all it takes to create a type-safe JSON-RPC API. 🎉

## Demo

You can play with a live example over at StackBlitz:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/@lorefnon/ts-json-rpc-express?file=client%2Fmain.ts)

# Advanced Usage

## Accessing the request

Sometimes it's necessary to access the request object inside the service. A common pattern is to define the service as `class` and create a new instance for each request:

```ts
export class MyServiceImpl {
  /**
   * Create a new service instance for the given request headers.
   */
  constructor(private headers: Record<string, string | string[]>) {}

  /**
   * Echo the request header with the specified name.
   */
  async echoHeader(name: string) {
    return this.headers[name.toLowerCase()];
  }
}

export type MyService = typeof MyServiceImpl;
```

Then, in your server, pass a _function_ to `rpcHandler` that creates a service instance with the headers taken from the incoming request:

```ts
app.post(
  "/api",
  rpcHandler((req) => new MyService(req.headers))
);
```

## Sending custom headers

A client can send custom request headers by providing a `getHeaders` function:

```ts
const client = rpcClient<MyService>(apiUrl, {
  getHeaders() {
    return {
      Authorization: auth,
    };
  },
});
```

> **Note**
> The `getHeaders` function can also be `async`.

## CORS credentials

To include credentials in cross-origin requests, pass `credentials: 'include'` as option.

## Support for other runtimes

The generic `@lorefnon/ts-json-rpc/server` package can be used with any server framework or (edge-) runtime.

### Fastify

With [Fastify](https://www.fastify.io/), you would use `@lorefnon/ts-json-rpc` like this:

```ts
import { handleRpc, isJsonRpcRequest } from "@lorefnon/ts-json-rpc/lib/server";

fastify.post("/api", async (req, reply) => {
  if (isJsonRpcRequest(req.body)) {
    const res = await handleRpc(req.body, new Service(req.headers));
    reply.send(res);
  }
});
```

## Runtime type checking

There is preliminary support for runtime type checking through zod.

```ts
// shared/service.ts

import { ZService } from "@lorefnon/ts-json-rpc/lib/zod"

export const MyServiceDef = ZService.define({
  hello: z.function()
    .args(z.string())
    .returns(z.string())
})

export type MyService = ZServiceType<typeof MyServiceDef> // { hello: (name: string) => string }
```

```ts
// backend/service.ts
import { MyServiceDef } from "<...>/shared/service.ts"

const serviceFactory = MyServiceDef.implement(() => ({
  hello(name) { // type of name is automatically inferred
    return `Hello ${name}`;
  }
}))

// Pass serviceFactory to rpcHandler
```

```ts
// client/service.ts

import { MyService } from "<...>/shared/service.ts"

const myService = rpcClient<MyService>
```

## React hooks

While `@lorefnon/ts-json-rpc` itself does not provide any built-in UI framework integrations,
you can pair it with [react-api-query](https://www.npmjs.com/package/react-api-query),
a thin wrapper around _TanStack Query_. A type-safe match made in heaven. 💕

# License

MIT
