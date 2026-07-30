import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS, STORAGE_PROVIDER } from "@/lib/constants";
import { createR2UploadUrl, deleteR2UploadedObjects } from "@/services/storage/storage.actions";
import { withTimeout } from "@/utils/with-timeout";
import type { Database } from "@/types/database.types";

type Bucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

// O upload.storage.from().upload() do supabase-js nao tem timeout proprio —
// numa conexao ruim ou instavel ele pode ficar pendurado indefinidamente,
// sem nunca resolver nem rejeitar. Sem um limite, a tela fica em "Enviando..."
// para sempre (sem barra de progresso nessa etapa), o usuario acha que
// travou e fecha a aba no meio do envio — o registro do video ja foi criado
// nesse ponto, entao sobra um "pendente" sem arquivo nenhum (ver moderacao).
// O piso de 60s + throughput minimo assumido de 150KB/s da folga generosa
// pra conexao lenta-mas-funcionando, sem deixar a espera ser infinita. Usado
// para arquivos pequenos (avatar, banner, thumbnail) onde a folga generosa
// nunca chega perto do limite na pratica — para o upload de video em si, ver
// `uploadWithProgress` abaixo.
const MIN_UPLOAD_TIMEOUT_MS = 60_000;
const ASSUMED_MIN_THROUGHPUT_BYTES_PER_SEC = 150 * 1024;

function uploadTimeoutMs(fileSizeBytes: number): number {
  return Math.max(MIN_UPLOAD_TIMEOUT_MS, (fileSizeBytes / ASSUMED_MIN_THROUGHPUT_BYTES_PER_SEC) * 1000);
}

// Um video grande numa internet residencial fraca pode ter throughput real
// bem abaixo dos 150KB/s assumidos acima — o que derrubava envios legitimos
// (so lentos, nao travados) com "conexao lenta" mesmo quando teriam
// terminado com mais tempo. Aqui o progresso real (XMLHttpRequest e o unico
// jeito de obter isso no navegador — fetch nao expoe progresso de upload)
// substitui o prazo total: qualquer avanco reinicia o relogio, so a
// AUSENCIA de avanco por STALL_TIMEOUT_MS seguidos e tratada como travamento
// genuino. Conexao lenta-mas-viva tem tempo ilimitado para terminar.
const STALL_TIMEOUT_MS = 45_000;
const STALL_ERROR_MARKER = "upload-stalled";

function uploadFileViaXhr(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (fraction: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    let stallTimer: ReturnType<typeof setTimeout>;
    const resetStallTimer = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => xhr.abort(), STALL_TIMEOUT_MS);
    };
    resetStallTimer();

    xhr.upload.onprogress = (event) => {
      resetStallTimer();
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      clearTimeout(stallTimer);
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`HTTP ${xhr.status}`));
    };
    xhr.onerror = () => {
      clearTimeout(stallTimer);
      reject(new Error("Erro de rede durante o envio"));
    };
    xhr.onabort = () => {
      clearTimeout(stallTimer);
      reject(new Error(STALL_ERROR_MARKER));
    };

    xhr.send(file);
  });
}

// --- Cloudflare R2 -----------------------------------------------------
// R2 nao tem SDK client-side nem RLS — a URL assinada de PUT vem de um
// server action (storage.actions.ts) que checa login antes de gerar,
// depois o navegador envia o arquivo direto pro R2 (mesmo padrao XHR
// usado com o Supabase). So entra em uso quando STORAGE_PROVIDER === "r2".

async function uploadR2(bucket: Bucket, path: string, file: File): Promise<string> {
  const uploadUrl = await createR2UploadUrl(bucket, path, file.type || "application/octet-stream");
  const response = await withTimeout(
    fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    }),
    uploadTimeoutMs(file.size),
    "O envio demorou demais e foi interrompido — verifique sua conexão e tente novamente."
  );
  if (!response.ok) throw new Error(`Falha ao enviar arquivo para ${bucket}/${path}: HTTP ${response.status}`);
  return path;
}

async function uploadWithProgressR2(
  bucket: Bucket,
  path: string,
  file: File,
  onProgress?: (fraction: number) => void
): Promise<string> {
  if (typeof XMLHttpRequest === "undefined") return uploadR2(bucket, path, file);

  try {
    const uploadUrl = await createR2UploadUrl(bucket, path, file.type || "application/octet-stream");
    await uploadFileViaXhr(uploadUrl, file, { "content-type": file.type || "application/octet-stream" }, onProgress);
    return path;
  } catch (err) {
    console.error(
      `[storage] envio com progresso falhou para ${bucket}/${path}, tentando metodo antigo sem progresso:`,
      err
    );
    return uploadR2(bucket, path, file);
  }
}

function getPublicUrlR2(bucket: Bucket, path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base) throw new Error("R2 não configurado — defina NEXT_PUBLIC_R2_PUBLIC_URL no .env.");
  return `${base.replace(/\/$/, "")}/${bucket}/${path}`;
}

async function removeR2(bucket: Bucket, paths: string[]): Promise<void> {
  await deleteR2UploadedObjects(bucket, paths);
}

/**
 * Isola toda a interacao com o armazenamento de arquivos atras de uma
 * interface simples — cada operacao despacha pro provedor ativo
 * (STORAGE_PROVIDER, ver lib/constants.ts). Nenhuma feature depende
 * diretamente do SDK do Supabase Storage nem do R2.
 */
export function createStorageService(supabase: SupabaseClient<Database>) {
  async function upload(bucket: Bucket, path: string, file: File) {
    if (STORAGE_PROVIDER === "r2") return uploadR2(bucket, path, file);

    const { error } = await withTimeout(
      supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      }),
      uploadTimeoutMs(file.size),
      "O envio demorou demais e foi interrompido — verifique sua conexão e tente novamente."
    );
    if (error) throw new Error(`Falha ao enviar arquivo para ${bucket}/${path}: ${error.message}`);
    return path;
  }

  /**
   * Mesma operacao que `upload`, mas reporta progresso real via
   * XMLHttpRequest e so aborta por travamento genuino (sem avanco por
   * STALL_TIMEOUT_MS) em vez de um prazo total — ver comentario acima.
   * So funciona no navegador (XMLHttpRequest); em qualquer outro contexto
   * cai de volta em `upload` sem progresso.
   *
   * Caminho novo (URL assinada + XMLHttpRequest) e recente e ainda pode
   * ter modo de falha que nao mapeamos (proxy/CORS especifico de alguma
   * rede, etc. — visto na pratica: upload ficando incompleto sem erro
   * claro pro usuario). Qualquer falha nesse caminho cai pro metodo
   * antigo (supabase-js .upload(), sem progresso mas comprovadamente
   * confiavel ha meses, inclusive testado com arquivo de 151MB) em vez de
   * deixar o envio inteiro falhar. So perde a barra de progresso nesse
   * caso, nao a funcionalidade.
   */
  async function uploadWithProgress(
    bucket: Bucket,
    path: string,
    file: File,
    onProgress?: (fraction: number) => void
  ) {
    if (STORAGE_PROVIDER === "r2") return uploadWithProgressR2(bucket, path, file, onProgress);

    if (typeof XMLHttpRequest === "undefined") {
      return upload(bucket, path, file);
    }

    try {
      const { data: signed, error: signError } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
      if (signError || !signed) throw new Error(signError?.message ?? "erro desconhecido ao preparar envio");

      await uploadFileViaXhr(
        signed.signedUrl,
        file,
        {
          "x-upsert": "false",
          "cache-control": "3600",
          "content-type": file.type || "application/octet-stream",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        },
        onProgress
      );

      return path;
    } catch (err) {
      console.error(
        `[storage] envio com progresso falhou para ${bucket}/${path}, tentando metodo antigo sem progresso:`,
        err
      );
      return upload(bucket, path, file);
    }
  }

  function getPublicUrl(bucket: Bucket, path: string | null): string | null {
    if (!path) return null;
    if (STORAGE_PROVIDER === "r2") return getPublicUrlR2(bucket, path);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function remove(bucket: Bucket, paths: string[]) {
    if (paths.length === 0) return;
    if (STORAGE_PROVIDER === "r2") return removeR2(bucket, paths);

    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw new Error(`Falha ao remover arquivos de ${bucket}: ${error.message}`);
  }

  return { upload, uploadWithProgress, getPublicUrl, remove };
}

export type StorageService = ReturnType<typeof createStorageService>;
