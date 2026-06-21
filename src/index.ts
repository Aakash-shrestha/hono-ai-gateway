import type { Context, MiddlewareHandler } from "hono";
import type { ChatRequest, GatewayConfig } from "./types";
import { validateAuth } from "./auth";
import { getCached, hashPrompt, setCached } from "./cache";
import { callWithFallback } from "./router";

export function createGateway(config: GatewayConfig) {
  const authMiddleware: MiddlewareHandler = async (c, next) => {
    const authHeader = c.req.header("Authorization");
    const isValid = validateAuth(authHeader, config.gatewayApiKey); //closure, config, outer function parameter is used in the inner function
    if (!isValid) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  };

  const cacheMiddleware: MiddlewareHandler = async (c, next) => {
    const body = await c.req.json<ChatRequest>();
    const key = await hashPrompt(body.prompt);
    const cached = await getCached(config.cache, key);
    if (cached) {
      return c.json({ response: cached });
    }
    c.set("body", body);

    await next();

    const responseText = await c.res.text();
    if (responseText) {
      await setCached(config.cache, key, responseText, 3600);
    }
  };

  const handler = async (c: Context) => {
    const body = c.get("body") as ChatRequest;
    const response = await callWithFallback(body.providers, body.prompt);
    return c.json({ response: response });
  };

  return {
    middleware: [authMiddleware, cacheMiddleware],
    handler,
  };
}
