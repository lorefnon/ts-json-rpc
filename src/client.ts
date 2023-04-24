export class RpcError extends Error {
  code: number;
  data?: unknown;

  constructor(message: string, code: number, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
    // https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
    Object.setPrototypeOf(this, RpcError.prototype);
  }
}

export interface Transport<TMeta = undefined> {
  request: (method: string, params: any[], meta?: TMeta) => Promise<any>;
}

export interface RpcOptions<TMeta = undefined> {
  transport: Transport<TMeta>
  meta?: TMeta
  onStart?: (meta?: TMeta) => void | Promise<void>
  onEnd?: (meta?: TMeta, error?: unknown) => void | Promise<void>
  onSuccess?: (meta?: TMeta) => void | Promise<void>
  onError?: (meta?: TMeta, error?: unknown) => void | Promise<void>
}

type HttpPostTransportParams = {
  url: string;
  credentials?: RequestCredentials;
  getHeaders?():
    | Record<string, string>
    | Promise<Record<string, string>>
    | undefined;
};

type Promisify<T> = T extends (...args: any[]) => Promise<any>
  ? T // already a promise
  : T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : T; // not a function;

type PromisifyMethods<T extends object> = {
  [K in keyof T]: Promisify<T[K]>;
};

export function rpcClient<TService extends {}, TMeta = undefined>(options: RpcOptions<TMeta>) {
  return new Proxy(
    {},
    {
      /* istanbul ignore next */
      get(target, prop, receiver) {
        if (typeof prop === "symbol") return;
        if (prop.startsWith("$")) return;
        if (prop in Object.prototype) return;
        if (prop === "toJSON") return;
        return async (...args: any) => {
          try {
            await options?.onStart?.(options.meta)
            const res = await options.transport.request(prop.toString(), args, options.meta);
            await options?.onSuccess?.(options.meta)
            await options?.onEnd?.(options.meta)
            return res
          } catch (error: unknown) {
            await options?.onError?.(options.meta, error)
            await options?.onEnd?.(options.meta, error)
            throw error
          }
        }
      },
    }
  ) as PromisifyMethods<TService>;
}

export class HttpPostTransport<TMeta = undefined> {
  constructor(
    private options: HttpPostTransportParams,
  ) { }

  protected getVerb(method: string, params: any[], meta?: TMeta) {
    return "POST";
  }

  protected getBody(method: string, params: any[], meta?: TMeta) {
    const id = Date.now();
    return JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params: removeTrailingUndefs(params),
    });
  }

  protected getUrl(method: string, params: any[], meta?: TMeta) {
    return this.options.url;
  }

  protected getCredentials(method: string, params: any[], meta?: TMeta) {
    return this.options.credentials;
  }

  async request(
    method: string,
    params: any[],
    meta?: TMeta
  ): Promise<any> {
    const headers = await this.options.getHeaders?.() ?? {};
    const url = this.getUrl(method, params, meta);
    const res = await fetch(url, {
      method: this.getVerb(method, params, meta),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
      body: this.getBody(method, params, meta),
      credentials: this.getCredentials(method, params, meta),
    });
    if (!res.ok) {
      throw new RpcError(res.statusText, res.status);
    }
    const { result, error } = await res.json();
    if (error) {
      const { code, message, data } = error;
      throw new RpcError(message, code, data);
    }
    return result;
  }
}

export function removeTrailingUndefs(values: any[]) {
  const a = [...values];
  while (a.length && a[a.length - 1] === undefined) a.length--;
  return a;
}
