export type AIProviderName = "anthropic" | "gemini" | "openai" | "openrouter";

export interface GenerateTextInput {
  prompt: string;
  system?: string;
  maxTokens?: number;
}

export interface GenerateTextOutput {
  text: string;
  provider: AIProviderName;
}

export interface VideoMetadataSuggestion {
  title: string;
  description: string;
  tags: string[];
}
