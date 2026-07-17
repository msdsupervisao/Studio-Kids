"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadVideo, type UploadVideoInput } from "@/features/video/actions/video.actions";
import { ROUTES } from "@/lib/constants";

export type UploadPhase = "idle" | "sending" | "success" | "error";

/**
 * Server Actions no Next.js ainda nao expoem progresso de upload por
 * byte (isso exigiria XHR/fetch com ReadableStream manual para um
 * endpoint dedicado). Por isso o progresso aqui e por fase, nao por
 * porcentagem exata do arquivo — e uma limitacao conhecida, documentada
 * no ROADMAP para uma iteracao futura com upload direto ao Storage via
 * signed URL + XHR.
 */
export function useUpload() {
  const router = useRouter();
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(input: UploadVideoInput) {
    setPhase("sending");
    setError(null);
    try {
      const result = await uploadVideo(input);
      setPhase("success");
      toast.success("Video enviado! Ele ficara visivel apos aprovacao.");
      router.push(ROUTES.professorVideos);
      return result;
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
