import type { AIProvider } from "@/services/ia/ai-provider.interface";
import type { GenerateTextInput, GenerateTextOutput } from "@/types/ai.types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4.5";

export function createOpenRouterProvider(apiKey: string): AIProvider {
  return {
    async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
          "X-Title": "EduTube",
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: input.maxTokens ?? 1024,
          messages: [
            ...(input.system ? [{ role: "system", content: input.system }] : []),
            { role: "user", content: input.prompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const text = data.choices[0]?.message.content ?? "";

      return { text, provider: "openrouter" };
    },
  };
}
