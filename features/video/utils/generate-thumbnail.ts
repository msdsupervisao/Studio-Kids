import { withTimeout } from "@/utils/with-timeout";

const SEEK_SECONDS = 1;
const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.85;
const GENERATION_TIMEOUT_MS = 8_000;

async function extractFrame(file: File): Promise<File> {
  const videoEl = document.createElement("video");
  videoEl.preload = "metadata";
  videoEl.muted = true;
  videoEl.src = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      videoEl.onloadedmetadata = () => resolve();
      videoEl.onerror = () => reject(new Error("Falha ao carregar metadados do vídeo"));
    });

    videoEl.currentTime = Math.min(SEEK_SECONDS, videoEl.duration / 2 || 0);
    await new Promise<void>((resolve, reject) => {
      videoEl.onseeked = () => resolve();
      videoEl.onerror = () => reject(new Error("Falha ao buscar frame do vídeo"));
    });

    const scale = Math.min(1, MAX_WIDTH / videoEl.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(videoEl.videoWidth * scale);
    canvas.height = Math.round(videoEl.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D não suportado");
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("Falha ao gerar imagem do frame");

    return new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(videoEl.src);
  }
}

/**
 * Gera uma miniatura automaticamente a partir de um frame do próprio vídeo
 * (mesma ideia do YouTube) para o professor não precisar caçar uma imagem à
 * parte. Roda inteiramente no navegador via <video>+<canvas>, sem custo de
 * servidor. Retorna null em qualquer falha (formato incomum, timeout) — a
 * miniatura sempre foi opcional, então isso nunca deve bloquear o envio.
 */
export async function generateVideoThumbnail(file: File): Promise<File | null> {
  try {
    return await withTimeout(extractFrame(file), GENERATION_TIMEOUT_MS, "Tempo esgotado ao gerar miniatura");
  } catch (err) {
    console.error("[generateVideoThumbnail] falha ao gerar miniatura automática:", err);
    return null;
  }
}
