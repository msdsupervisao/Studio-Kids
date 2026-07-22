"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateVideoStatus } from "@/features/video/actions/video.actions";

export function VideoApprovalActions({ videoId }: { videoId: string }) {
  const [isPending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      try {
        await updateVideoStatus(videoId, "published");
        toast.success("Vídeo aprovado e publicado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao aprovar vídeo");
      }
    });
  }

  function reject() {
    const reason = window.prompt("Motivo da rejeição (visível ao professor):");
    if (reason === null) return;
    startTransition(async () => {
      try {
        await updateVideoStatus(videoId, "rejected", reason);
        toast.success("Vídeo rejeitado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao rejeitar vídeo");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={approve} disabled={isPending} className="gap-1">
        <Check className="h-4 w-4" /> Aprovar
      </Button>
      <Button size="sm" variant="outline" onClick={reject} disabled={isPending} className="gap-1">
        <X className="h-4 w-4" /> Rejeitar
      </Button>
    </div>
  );
}
