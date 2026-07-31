"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/services/supabase/server";
import { passwordSchema } from "@/lib/validations";
import { ROUTES } from "@/lib/constants";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/user.types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
 * Reautentica o admin logado com a senha digitada no dialogo — barreira
 * extra antes de uma acao irreversivel (apagar conta) ou sensivel
 * (definir a senha de outra pessoa). Um simples confirm() do navegador
 * nao protege contra clique acidental nem prova que quem esta na frente
 * da tela ainda e o admin (sessao pode ter ficado aberta na sala).
 *
 * Retorna a mensagem de erro em vez de lancar excecao — Server Actions
 * chamadas como funcao comum (nao via <form action>) tem a mensagem de
 * qualquer erro LANCADO escondida pelo Next.js em producao (vira "An
 * error occurred in the Server Components render..." sem pista nenhuma
 * do motivo real, mesmo pra erro esperado tipo senha errada). Retornar
 * como dado normal evita esse problema inteiramente.
 */
async function verifyAdminPassword(
  supabase: SupabaseServerClient,
  user: User,
  confirmPassword: string
): Promise<string | null> {
  if (!confirmPassword) return "Digite sua senha para confirmar.";
  const { error } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: confirmPassword });
  if (error) return "Senha incorreta.";
  return null;
}

/**
 * Apaga a conta (auth.users) — a cascata de FKs remove profile, canais,
 * videos, comentarios, etc. Precisa da service role porque apagar um
 * usuario de autenticacao so e possivel pela Admin API, nao por uma
 * query comum na tabela profiles.
 */
export async function deleteUser(userId: string, confirmPassword: string): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };
  if (user.id === userId) return { error: "Você não pode remover sua própria conta." };

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || !isAdmin) return { error: "Apenas administradores podem remover contas." };

  const passwordError = await verifyAdminPassword(supabase, user, confirmPassword);
  if (passwordError) return { error: passwordError };

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
 * aqui.
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string,
  confirmPassword: string
): Promise<AdminActionResult> {
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

  const passwordError = await verifyAdminPassword(supabase, user, confirmPassword);
  if (passwordError) return { error: passwordError };

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password: parsedPassword.data });
  if (error) {
    console.error("[resetUserPassword] falha na Admin API:", error);
    return { error: `Falha ao redefinir senha: ${error.message}` };
  }

  return {};
}
