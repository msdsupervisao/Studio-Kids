import type { AIProvider } from "@/services/ia/ai-provider.interface";
import type { GenerateTextInput, GenerateTextOutput } from "@/types/ai.types";

const DEFAULT_MODEL = "gemini-2.0-flash";

export function createGeminiProvider(apiKey: string): AIProvider {
  return {
    async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: input.system ? { parts: [{ text: input.system }] } : undefined,
          contents: [{ role: "user", parts: [{ text: input.prompt }] }],
          generationConfig: { maxOutputTokens: input.maxTokens ?? 1024 },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as {
        candidates: Array<{ content: { parts: Array<{ text?: string }> } }>;
      };
      const text = data.candidates[0]?.content.parts.map((part) => part.text ?? "").join("") ?? "";

      return { text, provider: "gemini" };
    },
  };
}
