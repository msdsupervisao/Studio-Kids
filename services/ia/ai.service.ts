import { env } from "@/lib/env";
import { createClaudeProvider } from "@/services/ia/providers/claude.provider";
import { createGeminiProvider } from "@/services/ia/providers/gemini.provider";
import { createOpenAIProvider } from "@/services/ia/providers/openai.provider";
import { createOpenRouterProvider } from "@/services/ia/providers/openrouter.provider";
import type { AIProvider } from "@/services/ia/ai-provider.interface";
import type { AIProviderName, VideoMetadataSuggestion } from "@/types/ai.types";

/**
 * Ponto unico de acesso a IA. `AI_PROVIDER` no .env escolhe o provedor
 * ativo sem precisar tocar em nenhuma feature — todas dependem apenas
 * de getAIProvider()/suggestVideoMetadata() daqui.
 */
function buildProvider(name: AIProviderName): AIProvider {
  switch (name) {
    case "anthropic": {
      if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY nao configurada");
      return createClaudeProvider(env.ANTHROPIC_API_KEY);
    }
    case "gemini": {
      if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY nao configurada");
      return createGeminiProvider(env.GEMINI_API_KEY);
    }
    case "openai": {
      if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY nao configurada");
      return createOpenAIProvider(env.OPENAI_API_KEY);
    }
    case "openrouter": {
      if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY nao configurada");
      return createOpenRouterProvider(env.OPENROUTER_API_KEY);
    }
  }
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!cachedProvider) {
    cachedProvider = buildProvider(env.AI_PROVIDER);
  }
  return cachedProvider;
}

const METADATA_SYSTEM_PROMPT = `Voce e um assistente que ajuda professores a publicar aulas em video no EduTube.
Dado um titulo provisorio e uma descricao (opcionalmente incompleta) de uma aula, responda SOMENTE com um JSON
no formato {"title": string, "description": string, "tags": string[]}, sem markdown, sem texto fora do JSON.
O titulo deve ter no maximo 100 caracteres, ser claro e atrativo. A descricao deve ter 2 a 4 paragrafos curtos,
explicando o que o aluno vai aprender. As tags devem ter entre 3 e 8 palavras-chave relevantes, em minusculas.`;

export async function suggestVideoMetadata(input: {
  draftTitle: string;
  draftDescription?: string;
}): Promise<VideoMetadataSuggestion> {
  const provider = getAIProvider();
  const { text } = await provider.generateText({
    system: METADATA_SYSTEM_PROMPT,
    prompt: `Titulo provisorio: ${input.draftTitle}\nDescricao provisoria: ${input.draftDescription ?? "(vazia)"}`,
    maxTokens: 800,
  });

  try {
    const parsed = JSON.parse(text) as VideoMetadataSuggestion;
    return parsed;
  } catch {
    throw new Error("A IA retornou um formato inesperado. Tente novamente.");
  }
}
