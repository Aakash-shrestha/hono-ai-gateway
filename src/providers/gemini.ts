import type { LLMProvider } from "../types";
type GeminiResponse = {
  candidates: { content: { parts: { text: string }[] } }[];
};
export const geminiProvider: LLMProvider = {
  name: "gemini",
  chat: async (prompt, model, apiKey) => {
    const chatBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatBody),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini error ${response.status}: ${errText}`);
    }
    const data: GeminiResponse = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Gemini returned no content");
    return content;
  },
};
