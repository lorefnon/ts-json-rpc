import type { IncomingMessage } from "http";
import type { RawData, WebSocket } from "ws";
import type { RpcHandlerOptions } from "./server";
import { handleRpc } from "./server";

export interface ServiceFactory {
  (ws: WebSocket, req: IncomingMessage): object;
}

export interface RpcConnectionHandlerOptions extends RpcHandlerOptions {
  /**
   * Called when an incoming message cannot be parsed as JSON.
   * If not provided, a JSON-RPC parse error response is sent back.
   */
  onParseError?: (ws: WebSocket, err: unknown, data: RawData) => void;
  /**
   * Called when handling a message rejects unexpectedly.
   * If not provided, the error is logged via `console.error`.
   */
  onError?: (ws: WebSocket, err: unknown) => void;
}

export function rpcConnectionHandler(
  serviceOrFactory: object | ServiceFactory,
  options?: RpcConnectionHandlerOptions
): (ws: WebSocket, req: IncomingMessage) => void {
  return (ws, req) => {
    const service =
      typeof serviceOrFactory === "function"
        ? serviceOrFactory(ws, req)
        : serviceOrFactory;

    ws.on("message", (data) => {
      let request: any;
      try {
        request = JSON.parse(data.toString());
      } catch (err) {
        if (options?.onParseError) {
          options.onParseError(ws, err, data);
        } else {
          ws.send(
            JSON.stringify({
              jsonrpc: "2.0",
              id: null,
              error: { code: -32700, message: "Parse error" },
            })
          );
        }
        return;
      }

      handleRpc(request, service, options)
        .then((result) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(result));
          }
        })
        .catch((err) => {
          if (options?.onError) options.onError(ws, err);
          else console.error(err);
        });
    });
  };
}
