import type { AIProvider } from "@/services/ia/ai-provider.interface";
import type { GenerateTextInput, GenerateTextOutput } from "@/types/ai.types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-5";

/**
 * Provedor padrao do EduTube. Escolhido por ser o mais forte em
 * gerar conteudo educacional longo (resumos de aula, feedback
 * pedagogico) com nuance e baixa taxa de alucinacao.
 */
export function createClaudeProvider(apiKey: string): AIProvider {
  return {
    async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: input.maxTokens ?? 1024,
          system: input.system,
          messages: [{ role: "user", content: input.prompt }],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
      }

      const data = (await response.json()) as {
        content: Array<{ type: string; text?: string }>;
      };
      const text = data.content.find((block) => block.type === "text")?.text ?? "";

      return { text, provider: "anthropic" };
    },
  };
}
