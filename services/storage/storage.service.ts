import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type Bucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Isola toda a interacao com Supabase Storage atras de uma interface
 * simples. Se no futuro o armazenamento migrar (ex: bucket privado +
 * signed URLs, ou outro provedor), so este arquivo muda — nenhuma
 * feature depende diretamente do SDK do Supabase Storage.
 */
export function createStorageService(supabase: SupabaseClient<Database>) {
  async function upload(bucket: Bucket, path: string, file: File) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
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
