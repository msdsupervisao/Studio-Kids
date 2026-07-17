import type { GenerateTextInput, GenerateTextOutput } from "@/types/ai.types";

/**
 * Contrato comum a todo provedor de IA. Qualquer novo provedor so
 * precisa implementar isto e ser registrado em ai.service.ts — nenhuma
 * feature (ex: AIGenerateButton) fala diretamente com um SDK externo.
 */
export interface AIProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
}
