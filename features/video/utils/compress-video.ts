import type { FFmpeg } from "@ffmpeg/ffmpeg";

const CORE_VERSION = "0.12.10";
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

// Video com bitrate ja abaixo disso nao compensa recomprimir — o tempo de
// processamento no navegador nao se traduziria em economia real de banda.
const TARGET_BITRATE_MBPS = 2.5;
const MAX_HEIGHT = 720;

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

function isAlreadyCompact(file: File, durationSeconds: number): boolean {
  if (durationSeconds <= 0) return false;
  const bitrateMbps = (file.size * 8) / durationSeconds / 1_000_000;
  return bitrateMbps <= TARGET_BITRATE_MBPS;
}

function getVideoHeight(file: File): Promise<number> {
  return new Promise((resolve) => {
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.onloadedmetadata = () => {
      resolve(videoEl.videoHeight || 0);
      URL.revokeObjectURL(videoEl.src);
    };
    videoEl.onerror = () => resolve(0);
    videoEl.src = URL.createObjectURL(file);
  });
}

/**
 * Recomprime o video no navegador (ffmpeg.wasm) antes do upload, para
 * reduzir consumo de storage/banda no Supabase. Se o video ja for compacto,
 * se o navegador nao suportar WASM, ou se a compressao falhar por qualquer
 * motivo, retorna o arquivo original — nunca bloqueia o envio por causa
 * disso.
 */
export async function compressVideo(
  file: File,
  durationSeconds: number,
  onProgress?: (ratio: number) => void
): Promise<File> {
  if (isAlreadyCompact(file, durationSeconds)) return file;

  try {
    const height = await getVideoHeight(file);
    const ffmpeg = await loadFFmpeg();
    const { fetchFile } = await import("@ffmpeg/util");

    const onProgressEvent = ({ progress }: { progress: number }) => {
      onProgress?.(Math.min(Math.max(progress, 0), 1));
    };
    ffmpeg.on("progress", onProgressEvent);

    const inputName = "input";
    const outputName = "output.mp4";
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const args = ["-i", inputName];
    if (height > MAX_HEIGHT) args.push("-vf", `scale=-2:${MAX_HEIGHT}`);
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputName
    );

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    ffmpeg.off("progress", onProgressEvent);
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: "video/mp4" });
    const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".mp4"), { type: "video/mp4" });

    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
}
