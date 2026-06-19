import type { LLMProvider } from "../types";
type ollamaResponse = {
  message: { content: string };
};
export const ollamaProvider: LLMProvider = {
  name: "ollama",
  chat: async (prompt, model, baseUrl) => {
    // using baseUrl isntead of apiKey, can get confusing but what to do huhuhu
    const chatBody = {
      model: model,
      messages: [{ role: "user", content: prompt }],
      stream: false, //otherwise ollama streams token one by one
    };
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatBody),
    });

    const data: ollamaResponse = await response.json();
    const content = data.message?.content;
    if (!content) throw new Error("Ollama returned no content");
    return content;
  },
};
