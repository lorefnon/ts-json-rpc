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

Define a server-side implementation of this service:

```ts
export const MyServiceImpl = MyServiceDef.implement(() => ({

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
app.post("/api", rpcHandler(MyServiceImpl));
app.listen(3000);
```

> **Note**
> You can also use @lorefnon/ts-json-rpc in servers other than Express.
> Check out to docs below for [examples](#support-for-other-runtimes).


On the client-side, import the shared type and create a typed `rpcClient` with it:

```ts
import { rpcClient, HttpPostTransport } from "@lorefnon/ts-json-rpc/lib/client";

// Import the type (not the implementation!)
import type { MyService } from "../shared/MyService";

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

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/typed-rpc-express-qeemgh?file=main.ts)

# Advanced Usage

## Service factories vs singletons

It is common for services to be created per request. `DefaultServiceImpl` in above example
is a service factory ie. a function that creates and returns an implementation of the service contract.

rpcHandler will invoke this function for every request to create a service object that handles that particular
request.

This is convenient if you need to access the request (more on this below) but if you don't, instead of a function
you could also create an instance and pass that to rpcHandler:

```ts
app.post("/api", rpcHandler(DefaultServiceImpl({})));
```

Now, we have a singleton service that handles all requests.

## Service context

The function passed to `ServiceDef.implement` can accept a context argument which is available to all the methods.

```ts
interface ServiceContext {
  currentUser?: { name: string }
}

export const MyServiceImpl = ServiceDef.implement((context: ServiceContext) => ({

  async hello() {
    return `Hello ${context.currentUser?.name ?? "Stranger"}!`;
  },

  // Implement other methods...
}));
```

You are responsible for passing this `context` to `DefaultServiceImpl`.

### Accessing the request

Most common use case for context is to get access to the request object.

So, by default rpcHandler will simply pass the request object to service factory as context.

However, if you want to ensure that your service implementation is not tied to a specific server implementation (eg. express) you can also
extract what you need from the request and pass it to the service factory.

```ts
app.post(
  "/api",
  rpcHandler((req) => MyServiceImpl(req.headers))
);
```

This is also useful if you need to inject any additional objects (eg. database pool instance) into the service.

## Support for other runtimes

The generic `@lorefnon/ts-json-rpc/server` package can be used with any server framework or (edge-) runtime.

### Fastify

With [Fastify](https://www.fastify.io/), you would use `@lorefnon/ts-json-rpc` like this:

```ts
import { handleRpc, isJsonRpcRequest } from "@lorefnon/ts-json-rpc/lib/server";

fastify.post("/api", async (req, reply) => {
  if (isJsonRpcRequest(req.body)) {
    const res = await handleRpc(req.body, Service(req));
    reply.send(res);
  }
});
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

## React hooks

While `@lorefnon/ts-json-rpc` itself does not provide any built-in UI framework integrations,
you can pair it with [react-api-query](https://www.npmjs.com/package/react-api-query),
a thin wrapper around _TanStack Query_. A type-safe match made in heaven. 💕

# License

MIT

# Lineage

This implementation is based on past work by [Felix Gnass](https://indieweb.social/@fgnass)
in [typed-rpc](https://github.com/fgnass/typed-rpc).

The typed-rpc repo is more minimal in its focus (eg. runtime type checking is explicitly not a goal)
and does not appear to be accepting pull requests.