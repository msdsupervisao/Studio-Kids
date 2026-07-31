"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/services/supabase/server";
import { passwordSchema } from "@/lib/validations";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/user.types";

export interface AdminActionResult {
  error?: string;
}

export async function updateUserRole(userId: string, role: UserRole): Promise<AdminActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) {
    console.error("[updateUserRole] falha ao atualizar papel:", error);
    return { error: `Falha ao atualizar papel do usuário: ${error.message}` };
  }
  revalidatePath(ROUTES.adminUsers);
  return {};
}

/**
 * Apaga a conta (auth.users) — a cascata de FKs remove profile, canais,
 * videos, comentarios, etc. Precisa da service role porque apagar um
 * usuario de autenticacao so e possivel pela Admin API, nao por uma
 * query comum na tabela profiles.
 *
 * Confirmacao e digitar o @usuario da conta (nao a senha de ninguem) —
 * a versao anterior pedia a senha do proprio admin como barreira extra,
 * mas na pratica confundia com o campo de senha nova ao lado (visto ao
 * vivo: admin digitou a mesma senha nos dois campos, achando que era
 * "confirme a senha nova", e a acao falhava toda vez). Digitar o nome de
 * usuario exato, ja visivel na tela, e igual de dificil de fazer sem
 * querer e impossivel de confundir com outro campo.
 */
export async function deleteUser(userId: string, confirmUsername: string): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };
  if (user.id === userId) return { error: "Você não pode remover sua própria conta." };

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || !isAdmin) return { error: "Apenas administradores podem remover contas." };

  const { data: targetProfile } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  if (!targetProfile) return { error: "Conta não encontrada." };
  if (confirmUsername.trim().toLowerCase() !== targetProfile.username.toLowerCase()) {
    return { error: `Digite exatamente "${targetProfile.username}" para confirmar.` };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[deleteUser] falha na Admin API:", error);
    return { error: `Falha ao remover conta: ${error.message}` };
  }

  revalidatePath(ROUTES.adminUsers);
  return {};
}

/**
 * Define uma nova senha para outra conta — unico jeito de recuperar
 * acesso nessa app, ja que contas sao por nome de usuario e o "e-mail"
 * usado no Supabase Auth e um endereco interno inventado
 * (usuario@contas.studiokids.internal), que ninguem realmente recebe
 * e-mail. "Esqueci minha senha" por e-mail nao funciona pra quase
 * nenhuma conta — quem esquece a senha depende de um admin redefinir
 * aqui. So exige ser admin (ja checado abaixo) — nao pede a senha do
 * proprio admin como confirmacao extra (ver comentario em deleteUser
 * sobre por que isso confundia mais do que protegia).
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || !isAdmin) return { error: "Apenas administradores podem redefinir senhas." };

  const parsedPassword = passwordSchema.safeParse(newPassword);
  if (!parsedPassword.success) {
    return { error: parsedPassword.error.issues[0]?.message ?? "Senha inválida" };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: parsedPassword.data });
  if (error) {
    console.error("[resetUserPassword] falha na Admin API:", error);
    return { error: `Falha ao redefinir senha: ${error.message}` };
  }

  return {};
}
