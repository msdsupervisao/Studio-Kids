"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVideo } from "@/features/video/actions/video.actions";
import { ROUTES } from "@/lib/constants";

export function VideoRowActions({ videoId, videoTitle }: { videoId: string; videoTitle: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Remover "${videoTitle}"? Essa ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      try {
        await deleteVideo(videoId);
        toast.success("Vídeo removido");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao remover vídeo");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={ROUTES.professorVideoEdit(videoId)}
        className="focus-ring flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="focus-ring flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isPending ? "Removendo..." : "Remover"}
      </button>
    </div>
  );
}
