import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { withTimeout } from "@/utils/with-timeout";

const CORE_VERSION = "0.12.10";
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

// Teto de qualidade — acima disso nao compensa o tempo de processamento no
// navegador pela economia real de banda. Piso — abaixo disso a imagem fica
// ruim demais pra valer o corte de mais bytes; nesse caso o video so nao
// cabe no limite em nenhuma qualidade razoavel (o app avisa em vez de
// tentar espremer mais).
const MAX_TARGET_BITRATE_MBPS = 2.5;
const MIN_TARGET_BITRATE_MBPS = 0.4;
// Codificacao por bitrate nao acerta o alvo com precisao total (variacao
// de cena, overhead de container/audio) — essa margem evita passar do
// limite por pouco depois de todo o trabalho de comprimir.
const SIZE_SAFETY_MARGIN = 0.85;
const MAX_HEIGHT = 720;
const LOW_BITRATE_MAX_HEIGHT = 480; // resolucao menor rende mais qualidade por bit quando o alvo e baixo

// Qualquer etapa aqui (ler metadados do video, baixar o ffmpeg.wasm de um
// CDN externo, codificar) pode travar sem nunca rejeitar a Promise — sem um
// limite de tempo global, o upload inteiro fica preso em "Comprimindo
// video... 0%" para sempre, com o usuario sem conseguir enviar nada. Video
// de verdade (varios minutos) pode legitimamente levar mais que um minuto
// pra codificar em WASM (bem mais lento que codigo nativo) — o prazo
// precisa ser generoso o bastante pra deixar isso terminar de verdade, nao
// so cair no fallback do arquivo original (que agora, com o teto de upload
// do plano atual, tem boa chance de nem caber).
const COMPRESSION_TIMEOUT_MS = 5 * 60_000;
const METADATA_TIMEOUT_MS = 8_000;

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
    })().catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

function isAlreadyCompact(file: File, maxTargetBytes: number): boolean {
  return file.size <= maxTargetBytes;
}

/**
 * Bitrate que caiba no orcamento de bytes disponivel pra duracao do video,
 * com margem de seguranca — codificar por qualidade fixa (CRF) nao garante
 * nenhum tamanho final especifico, um video longo "bem comprimido" ainda
 * pode passar do limite. Isso mira o TAMANHO, nao a qualidade.
 */
function targetBitrateMbps(durationSeconds: number, maxTargetBytes: number): number {
  if (durationSeconds <= 0) return MAX_TARGET_BITRATE_MBPS;
  const budgetBitrateMbps = (maxTargetBytes * 8 * SIZE_SAFETY_MARGIN) / durationSeconds / 1_000_000;
  return Math.max(MIN_TARGET_BITRATE_MBPS, Math.min(MAX_TARGET_BITRATE_MBPS, budgetBitrateMbps));
}

function getVideoHeight(file: File): Promise<number> {
  return new Promise<number>((resolve) => {
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

async function runCompression(
  file: File,
  durationSeconds: number,
  maxTargetBytes: number,
  onProgress?: (ratio: number) => void
): Promise<File> {
  const height = await withTimeout(
    getVideoHeight(file),
    METADATA_TIMEOUT_MS,
    "Tempo esgotado ao ler metadados do video"
  ).catch(() => 0);

  const bitrateMbps = targetBitrateMbps(durationSeconds, maxTargetBytes);
  const videoBitrateKbps = Math.round(bitrateMbps * 1000);
  const maxHeight = bitrateMbps < 1 ? LOW_BITRATE_MAX_HEIGHT : MAX_HEIGHT;

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
  if (height > maxHeight) args.push("-vf", `scale=-2:${maxHeight}`);
  args.push(
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-b:v",
    `${videoBitrateKbps}k`,
    "-maxrate",
    `${videoBitrateKbps}k`,
    "-bufsize",
    `${videoBitrateKbps * 2}k`,
    "-c:a",
    "aac",
    "-b:a",
    "96k",
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
}

/**
 * Recomprime o video no navegador (ffmpeg.wasm) antes do upload, mirando
 * caber em `maxTargetBytes` (nao so "menor", um TAMANHO especifico) — ver
 * `targetBitrateMbps`. Se o video ja couber no limite, se o navegador nao
 * suportar WASM, se a compressao falhar ou demorar mais que
 * COMPRESSION_TIMEOUT_MS, retorna o arquivo original — nunca bloqueia o
 * envio por causa disso (a checagem de tamanho final acontece depois, em
 * hooks/use-upload.ts).
 */
export async function compressVideo(
  file: File,
  durationSeconds: number,
  maxTargetBytes: number,
  onProgress?: (ratio: number) => void
): Promise<File> {
  if (isAlreadyCompact(file, maxTargetBytes)) return file;

  try {
    return await withTimeout(
      runCompression(file, durationSeconds, maxTargetBytes, onProgress),
      COMPRESSION_TIMEOUT_MS,
      "Tempo esgotado ao comprimir o video"
    );
  } catch (err) {
    // Sem isso, uma falha real do ffmpeg.wasm no meio da codificacao
    // (ex: estourar memoria) desaparece sem rastro nenhum — o fallback
    // silencioso pro arquivo original e proposital (nao trava o envio por
    // causa de compressao), mas perder a causa raiz dificulta descobrir
    // por que um video especifico nunca comprime o suficiente.
    console.error("[compressVideo] falha ao comprimir, usando arquivo original:", err);
    return file;
  }
}
