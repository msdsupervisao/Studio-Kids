import type { AIProvider } from "@/services/ia/ai-provider.interface";
import type { GenerateTextInput, GenerateTextOutput } from "@/types/ai.types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

export function createOpenAIProvider(apiKey: string): AIProvider {
  return {
    async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
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
        throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const text = data.choices[0]?.message.content ?? "";

      return { text, provider: "openai" };
    },
  };
}
