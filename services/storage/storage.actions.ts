"use server";

import { createR2PresignedUploadUrl, deleteR2Objects } from "@/services/storage/r2";
import { createClient } from "@/services/supabase/server";

/**
 * Ponte entre o navegador e o R2: o R2 não tem RLS como o Supabase
 * Storage, então a barreira de "precisa estar logado" que antes vinha de
 * graça da policy do bucket agora precisa ser checada aqui à mão antes de
 * gerar a URL assinada ou apagar qualquer coisa.
 */
async function requireLoggedInUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");
}

export async function createR2UploadUrl(bucket: string, path: string, contentType: string): Promise<string> {
  await requireLoggedInUser();
  return createR2PresignedUploadUrl(`${bucket}/${path}`, contentType);
}

export async function deleteR2UploadedObjects(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await requireLoggedInUser();
  await deleteR2Objects(paths.map((path) => `${bucket}/${path}`));
}
