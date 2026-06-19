import type { LLMProvider } from "../types";
type GroqResponse = {
  choices: { message: { content: string } }[];
};
export const groqProvider: LLMProvider = {
  name: "groq",
  chat: async (prompt, model, apiKey) => {
    const chatBody = {
      model: model,
      messages: [{ role: "user", content: prompt }],
    };
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(chatBody),
      },
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq error ${response.status}: ${errText}`);
    }
    const data: GroqResponse = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned no content");
    return content;
  },
};
