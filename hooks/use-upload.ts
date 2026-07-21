"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/services/supabase/client";
import { createStorageService } from "@/services/storage/storage.service";
import { createDraftVideo, finalizeVideoUpload, type UploadVideoInput } from "@/features/video/actions/video.actions";
import { addVideoToPlaylist } from "@/features/playlist/actions/playlist.actions";
import { compressVideo } from "@/features/video/utils/compress-video";
import { STORAGE_BUCKETS, ROUTES } from "@/lib/constants";

export type UploadPhase = "idle" | "compressing" | "sending" | "success" | "error";

/**
 * O arquivo de video (ate 2GB) e enviado direto do navegador para o
 * Supabase Storage, nao via Server Action — Server Actions truncam
 * corpos multipart grandes. Server Actions aqui so lidam com os campos
 * de texto (criar o rascunho, depois gravar os paths finais).
 */
export function useUpload(targetPlaylistId?: string) {
  const router = useRouter();
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function submit(input: UploadVideoInput) {
    setPhase("compressing");
    setProgress(0);
    setError(null);
    try {
      const compressedVideoFile = await compressVideo(input.videoFile, input.durationSeconds, (ratio) =>
        setProgress(Math.round(ratio * 100))
      );

      setPhase("sending");
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

      const videoExtension = compressedVideoFile.name.split(".").pop() ?? "mp4";
      const videoPath = `${input.channelId}/${videoId}.${videoExtension}`;
      await storage.upload(STORAGE_BUCKETS.videos, videoPath, compressedVideoFile);

      let thumbnailPath: string | null = null;
      if (input.thumbnailFile) {
        const thumbExtension = input.thumbnailFile.name.split(".").pop() ?? "jpg";
        thumbnailPath = `${input.channelId}/${videoId}.${thumbExtension}`;
        await storage.upload(STORAGE_BUCKETS.thumbnails, thumbnailPath, input.thumbnailFile);
      }

      await finalizeVideoUpload(videoId, videoPath, thumbnailPath);

      if (targetPlaylistId) {
        await addVideoToPlaylist(targetPlaylistId, videoId).catch(() => {});
      }

      setPhase("success");
      toast.success(
        targetPlaylistId
          ? "Video enviado e adicionado a playlist! Ele ficara visivel apos aprovacao."
          : "Video enviado! Ele ficara visivel apos aprovacao."
      );
      router.push(targetPlaylistId ? ROUTES.playlist(targetPlaylistId) : ROUTES.professorVideos);
      return { videoId };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha inesperada no upload";
      setError(message);
      setPhase("error");
      toast.error(message);
      return null;
    }
  }

  return { phase, progress, error, submit, isSubmitting: phase === "compressing" || phase === "sending" };
}
