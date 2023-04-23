# ts-json-rpc

![npm bundle size](https://img.shields.io/bundlephobia/minzip/@lorefnon/ts-json-rpc)

Lightweight [JSON-RPC](https://www.jsonrpc.org/specification) solution for TypeScript projects
that comes with the following features and non-features:

- 👩‍🔧 Service definition via TypeScript types
- 📜 JSON-RPC 2.0 protocol
- 🕵️ Full IDE autocompletion
- 🪶 Tiny footprint (< 1kB)
- 🌎 Support for Deno and edge runtimes
- 🚫 No code generation step
- 🚫 No batch requests
- 🚫 No runtime type-checking

## Basic Usage

Create a _service_ in your backend and export its type, so that the
frontend can access type information:

```ts
// server/myService.ts

export const myService = {
  hello(name: string) {
    return `Hello ${name}!`;
  },
};

export type MyService = typeof myService;
```

> **Note**
> Of course, the functions in your service can also be `async`.

Create a server with a route to handle the API requests:

```ts
// server/index.ts

import express from "express";
import { rpcHandler } from "@lorefnon/ts-json-rpc/express";
import { myService } from "./myService.ts";

const app = express();
app.use(express.json());
app.post("/api", rpcHandler(myService));
app.listen(3000);
```

> **Note**
> You can also use @lorefnon/ts-json-rpc in servers other than Express.
> Check out to docs below for [examples](#support-for-other-runtimes).

On the client-side, import the shared type and create a typed `rpcClient` with it:

```ts
// client/index.ts

import { rpcClient, HttpPostTransport } from "@lorefnon/ts-json-rpc";

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
import { handleRpc, isJsonRpcRequest } from "@lorefnon/ts-json-rpc/server";

fastify.post("/api", async (req, reply) => {
  if (isJsonRpcRequest(req.body)) {
    const res = await handleRpc(req.body, new Service(req.headers));
    reply.send(res);
  }
});
```

## Runtime type checking

> **Warning**
> Keep in mind that `@lorefnon/ts-json-rpc` does not perform any runtime type checks.

This is usually not an issue, as long as your service can handle this gracefully.
If you want, you can use a library like [io-ts](https://gcanti.github.io/io-ts/)
or [ts-runtime](https://fabiandev.github.io/ts-runtime/) to make sure that the
arguments you receive match the expected type.

## React hooks

While `@lorefnon/ts-json-rpc` itself does not provide any built-in UI framework integrations,
you can pair it with [react-api-query](https://www.npmjs.com/package/react-api-query),
a thin wrapper around _TanStack Query_. A type-safe match made in heaven. 💕

# License

MIT
