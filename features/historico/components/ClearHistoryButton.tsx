"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clearWatchHistory } from "@/features/historico/actions/history.actions";

export function ClearHistoryButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Limpar todo o historico? Essa acao nao pode ser desfeita.")) return;
    startTransition(async () => {
      try {
        await clearWatchHistory();
        toast.success("Historico limpo");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao limpar historico");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending} className="gap-2">
      <Trash2 className="h-4 w-4" />
      {isPending ? "Limpando..." : "Limpar historico"}
    </Button>
  );
}
