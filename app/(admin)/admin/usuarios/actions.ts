"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/user.types";

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(`Falha ao atualizar papel do usuário: ${error.message}`);
  revalidatePath(ROUTES.adminUsers);
}

/**
 * Apaga a conta (auth.users) — a cascata de FKs remove profile, canais,
 * videos, comentarios, etc. Precisa da service role porque apagar um
 * usuario de autenticacao so e possivel pela Admin API, nao por uma
 * query comum na tabela profiles.
 */
export async function deleteUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");
  if (user.id === userId) throw new Error("Você não pode remover sua própria conta.");

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || !isAdmin) throw new Error("Apenas administradores podem remover contas.");

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Falha ao remover conta: ${error.message}`);

  revalidatePath(ROUTES.adminUsers);
}
