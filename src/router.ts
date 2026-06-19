import { groqProvider } from "./providers/groq";
import { geminiProvider } from "./providers/gemini";
import { ollamaProvider } from "./providers/ollama";
import type { LLMProvider, ProviderConfig } from "./types";

const providerMap: Record<string, LLMProvider> = {
  groq: groqProvider,
  gemini: geminiProvider,
  ollama: ollamaProvider,
};

export const callWithFallback = async (
  providers: ProviderConfig[],
  prompt: string,
): Promise<string> => {
  for (const config of providers) {
    const provider = providerMap[config.name];
    if (!provider) throw new Error(`Unknown provider: ${config.name}`);

    try {
      return await provider.chat(prompt, config.model, config.apiKey);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`Provider ${config.name} failed: ${msg}`);
    }
  }
  throw new Error(
    "All providers failed — check your API keys and provider availability",
  );
};
