import type { Context } from "hono";
import type { ChatRequest, GatewayConfig } from "./types";
import { validateAuth } from "./auth";
import { getCached, hashPrompt, setCached } from "./cache";
import { callWithFallback } from "./router";

export function createGateway(config: GatewayConfig) {
  const handle = async (c: Context<any>) => {
    const authHeader = c.req.header("Authorization");
    const isValid = validateAuth(authHeader, config.gatewayApiKey); //closure, config, outer function parameter is used in the inner function
    if (!isValid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json<ChatRequest>();
    const key = await hashPrompt(body.prompt);
    const cached = await getCached(config.cache, key);
    if (cached) {
      return c.json({ response: cached });
    }

    const response = await callWithFallback(body.providers, body.prompt);

    if (response) {
      await setCached(config.cache, key, response, 3600);
    }

    return c.json({ response: response });
  };

  return {
    handle,
  };
}
