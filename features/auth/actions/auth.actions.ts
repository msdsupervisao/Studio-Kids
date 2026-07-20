"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { loginSchema, signupSchema, forgotPasswordSchema } from "@/lib/validations";
import { ROUTES } from "@/lib/constants";
import type { CurrentUser } from "@/types/user.types";

// Contas sao por nome de usuario, nao e-mail. O Supabase Auth exige um
// e-mail internamente, entao geramos um a partir do username — nunca
// exibido nem usado para enviar mensagens. Como "username" e unico e
// validado (letras minusculas, numeros, ponto, underline), o e-mail
// derivado tambem e unico.
function usernameToAuthEmail(username: string): string {
  return `${username}@contas.studiokids.internal`;
}

/** Usuario autenticado + profile, verificado no servidor (seguro para hidratar componentes client). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;

  return { id: user.id, email: user.email ?? "", profile };
}

export interface AuthActionState {
  error?: string;
  success?: boolean;
}

export async function signIn(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  // "@" no campo => conta antiga, criada com e-mail real, antes da
  // migracao para login por usuario. Sem "@" => nome de usuario, do qual
  // derivamos o e-mail interno gerado no cadastro.
  const email = parsed.data.identifier.includes("@")
    ? parsed.data.identifier
    : usernameToAuthEmail(parsed.data.identifier);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) {
    return { error: "Usuario ou senha incorretos" };
  }

  redirect(ROUTES.home);
}

export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: usernameToAuthEmail(parsed.data.username),
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        username: parsed.data.username,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ja existe uma conta com esse nome de usuario" };
    }
    return { error: "Nao foi possivel criar a conta. Tente novamente." };
  }

  redirect(ROUTES.firstAccess);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(ROUTES.login);
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail invalido" };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/configuracoes`,
  });

  // Sempre retorna sucesso, mesmo se o e-mail nao existir, para nao
  // permitir enumeracao de contas cadastradas.
  return { success: true };
}
