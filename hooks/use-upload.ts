"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/services/supabase/client";
import { createStorageService } from "@/services/storage/storage.service";
import { createDraftVideo, finalizeVideoUpload, type UploadVideoInput } from "@/features/video/actions/video.actions";
import { STORAGE_BUCKETS, ROUTES } from "@/lib/constants";

export type UploadPhase = "idle" | "sending" | "success" | "error";

/**
 * O arquivo de video (ate 2GB) e enviado direto do navegador para o
 * Supabase Storage, nao via Server Action — Server Actions truncam
 * corpos multipart grandes. Server Actions aqui so lidam com os campos
 * de texto (criar o rascunho, depois gravar os paths finais).
 */
export function useUpload() {
  const router = useRouter();
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(input: UploadVideoInput) {
    setPhase("sending");
    setError(null);
    try {
      // Objeto novo, so com campos de texto — nao repassar `input` inteiro,
      // que ainda carrega os File como propriedades e faria o Next.js
      // voltar a serializar tudo como multipart (o mesmo bug do upload
      // antigo).
      const { videoId } = await createDraftVideo({
        channelId: input.channelId,
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        durationSeconds: input.durationSeconds,
        isShort: input.isShort,
      });

      const supabase = createClient();
      const storage = createStorageService(supabase);

      const videoExtension = input.videoFile.name.split(".").pop() ?? "mp4";
      const videoPath = `${input.channelId}/${videoId}.${videoExtension}`;
      await storage.upload(STORAGE_BUCKETS.videos, videoPath, input.videoFile);

      let thumbnailPath: string | null = null;
      if (input.thumbnailFile) {
        const thumbExtension = input.thumbnailFile.name.split(".").pop() ?? "jpg";
        thumbnailPath = `${input.channelId}/${videoId}.${thumbExtension}`;
        await storage.upload(STORAGE_BUCKETS.thumbnails, thumbnailPath, input.thumbnailFile);
      }

      await finalizeVideoUpload(videoId, videoPath, thumbnailPath);

      setPhase("success");
      toast.success("Video enviado! Ele ficara visivel apos aprovacao.");
      router.push(ROUTES.professorVideos);
      return { videoId };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha inesperada no upload";
      setError(message);
      setPhase("error");
      toast.error(message);
      return null;
    }
  }

  return { phase, error, submit, isSubmitting: phase === "sending" };
}
