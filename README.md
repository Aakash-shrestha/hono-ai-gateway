# hono-ai-gateway

A lightweight, unified AI gateway middleware for [Hono](https://hono.dev) on Cloudflare Workers. Route requests across multiple LLM providers with built-in authentication, response caching, and automatic provider fallback.

## Features

- **Multi-provider routing** — Groq, Google Gemini, and Ollama (self-hosted) out of the box
- **Automatic fallback** — tries each provider in order; moves on if one fails
- **Response caching** — SHA-256 keyed Cloudflare KV cache with configurable TTL
- **Bearer token auth** — single API key guards the gateway endpoint
- **Zero dependencies** — only requires Hono as a peer; uses the native Fetch and Web Crypto APIs

## Installation

```bash
npm install hono-ai-gateway hono
```

## Quick Start

```typescript
import { Hono } from "hono";
import { createGateway } from "hono-ai-gateway";

type Bindings = {
  KV: KVNamespace;
  GATEWAY_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/chat", (c) => {
  const gateway = createGateway({
    cache: c.env.KV,
    gatewayApiKey: c.env.GATEWAY_API_KEY,
  });
  return gateway.handle(c);
});

export default app;
```

Make a request:

```bash
curl -X POST https://your-app.workers.dev/chat \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain what a Cloudflare Worker is in one sentence.",
    "providers": [
      { "name": "groq", "apiKey": "gsk_...", "model": "mixtral-8x7b-32768" },
      { "name": "gemini", "apiKey": "AIza...", "model": "gemini-pro" }
    ]
  }'
```

Response:

```json
{ "response": "A Cloudflare Worker is a serverless function that runs at the edge..." }
```

## API Reference

### `createGateway(config)`

Returns an object with a `handle` method you mount on any Hono route.

```typescript
import { createGateway } from "hono-ai-gateway";

const gateway = createGateway(config);
app.post("/chat", gateway.handle);
```

#### `GatewayConfig`

| Field           | Type          | Description                                     |
| --------------- | ------------- | ----------------------------------------------- |
| `cache`         | `KVNamespace` | Cloudflare Workers KV namespace for caching     |
| `gatewayApiKey` | `string`      | Secret used to validate the `Authorization` header |

### Request Body

```typescript
type ChatRequest = {
  prompt: string;
  providers: ProviderConfig[];
};

type ProviderConfig = {
  name: "groq" | "gemini" | "ollama";
  apiKey: string;  // base URL for ollama (e.g. "http://localhost:11434")
  model: string;
};
```

| Field       | Type               | Description                                         |
| ----------- | ------------------ | --------------------------------------------------- |
| `prompt`    | `string`           | The user message sent to the model                  |
| `providers` | `ProviderConfig[]` | Ordered list of providers to try (first = primary)  |

### Responses

| Status | Body                        | Condition                              |
| ------ | --------------------------- | -------------------------------------- |
| `200`  | `{ "response": "..." }`     | At least one provider returned a reply |
| `401`  | `{ "error": "Unauthorized" }` | Missing or invalid `Authorization` header |
| `500`  | `{ "error": "..." }`        | All providers failed                   |

## Supported Providers

### Groq

```json
{ "name": "groq", "apiKey": "gsk_your_key", "model": "mixtral-8x7b-32768" }
```

Uses the OpenAI-compatible `/v1/chat/completions` endpoint at `api.groq.com`. Any Groq-supported model identifier works.

### Google Gemini

```json
{ "name": "gemini", "apiKey": "AIza_your_key", "model": "gemini-pro" }
```

Uses the native `generateContent` REST API. Pass the model name exactly as it appears in the Gemini model list (e.g., `gemini-pro`, `gemini-1.5-flash`).

### Ollama (self-hosted)

```json
{ "name": "ollama", "apiKey": "http://localhost:11434", "model": "llama3" }
```

The `apiKey` field is treated as the Ollama base URL. Useful for local development or private deployments. Streaming is disabled.

## How Caching Works

Before calling any provider, the gateway computes a SHA-256 hash of the raw prompt and checks Cloudflare KV. On a cache hit, the stored response is returned immediately — no provider is contacted. On a miss, the first successful provider response is written to KV with a **1-hour TTL** and then returned.

## How Fallback Works

Providers are tried in the order they appear in the `providers` array. If a provider throws (network error, non-2xx response, etc.), the gateway logs the error and moves to the next provider. A `500` is only returned when every listed provider has failed.

```json
{
  "providers": [
    { "name": "groq",   "apiKey": "...", "model": "mixtral-8x7b-32768" },
    { "name": "gemini", "apiKey": "...", "model": "gemini-pro" },
    { "name": "ollama", "apiKey": "http://localhost:11434", "model": "llama3" }
  ]
}
```

In the example above, Groq is the primary provider. If it fails, Gemini is tried. If that also fails, Ollama is the last resort.

## Cloudflare Workers Setup

Add a KV namespace binding in your `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

Set your gateway API key as a secret:

```bash
wrangler secret put GATEWAY_API_KEY
```

## Development

```bash
npm run build   # Compiles TypeScript to dist/
```

The package targets ES2022 and ships as ESM. Type declarations are generated alongside compiled output.

## Requirements

- Cloudflare Workers runtime (uses `KVNamespace`, `crypto.subtle`)
- Hono `^4.12.26` (peer dependency)

## License

MIT
