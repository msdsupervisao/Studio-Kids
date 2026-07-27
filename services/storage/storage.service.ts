import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "@/lib/constants";
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
// pra conexao lenta-mas-funcionando, sem deixar a espera ser infinita.
const MIN_UPLOAD_TIMEOUT_MS = 60_000;
const ASSUMED_MIN_THROUGHPUT_BYTES_PER_SEC = 150 * 1024;

function uploadTimeoutMs(fileSizeBytes: number): number {
  return Math.max(MIN_UPLOAD_TIMEOUT_MS, (fileSizeBytes / ASSUMED_MIN_THROUGHPUT_BYTES_PER_SEC) * 1000);
}

/**
 * Isola toda a interacao com Supabase Storage atras de uma interface
 * simples. Se no futuro o armazenamento migrar (ex: bucket privado +
 * signed URLs, ou outro provedor), so este arquivo muda — nenhuma
 * feature depende diretamente do SDK do Supabase Storage.
 */
export function createStorageService(supabase: SupabaseClient<Database>) {
  async function upload(bucket: Bucket, path: string, file: File) {
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

  function getPublicUrl(bucket: Bucket, path: string | null): string | null {
    if (!path) return null;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  async function remove(bucket: Bucket, paths: string[]) {
    if (paths.length === 0) return;
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw new Error(`Falha ao remover arquivos de ${bucket}: ${error.message}`);
  }

  return { upload, getPublicUrl, remove };
}

export type StorageService = ReturnType<typeof createStorageService>;
