export type ProviderConfig = {
  name: string;
  apiKey: string;
  model: string;
};

export type ChatRequest = {
  prompt: string;
  providers: ProviderConfig[];
};

export interface LLMProvider {
  name: string;
  chat(prompt: string, model: string, apiKey: string): Promise<string>;
}

export interface GatewayConfig {
  cache: KVNamespace;
  gatewayApiKey: string;
}
