"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { VideoMetadataSuggestion } from "@/types/ai.types";

export function AIGenerateButton({
  draftTitle,
  draftDescription,
  onSuggestion,
}: {
  draftTitle: string;
  draftDescription: string;
  onSuggestion: (suggestion: VideoMetadataSuggestion) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!draftTitle.trim()) {
      toast.error("Escreva um titulo provisorio antes de usar a IA");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ia", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ draftTitle, draftDescription }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Falha ao gerar sugestao");
      onSuggestion(data as VideoMetadataSuggestion);
      toast.success("Sugestao aplicada. Revise antes de publicar.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar sugestao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={loading} className="gap-2">
      <Sparkles className="h-4 w-4" />
      {loading ? "Gerando..." : "Melhorar com IA"}
    </Button>
  );
}
