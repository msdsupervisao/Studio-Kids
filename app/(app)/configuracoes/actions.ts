"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { sanitizeMultilineText, sanitizePlainText } from "@/utils/sanitize";
import { changePasswordSchema } from "@/lib/validations";
import { STORAGE_BUCKETS, ROUTES } from "@/lib/constants";

export interface ProfileActionState {
  error?: string;
  success?: boolean;
}

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const fullName = sanitizePlainText(String(formData.get("fullName") ?? ""));
  const username = String(formData.get("username") ?? "").toLowerCase();
  const bio = formData.get("bio") ? sanitizeMultilineText(String(formData.get("bio"))) : null;

  if (fullName.length < 2) return { error: "Nome muito curto" };
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) return { error: "Nome de usuário inválido" };

  // Ao contrario de channels.avatar_url (resolvido para URL publica so
  // dentro de channel.actions.ts), profiles.avatar_url e lido em varios
  // pontos soltos do app (Topbar, comentarios, admin) sem um resolver
  // central — por isso aqui gravamos a URL publica final direto no
  // banco, ja pronta para uso em <img>/<AvatarImage>.
  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatarFile");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const avatarPath = `${user.id}/avatar-${Date.now()}.${avatarFile.name.split(".").pop() ?? "jpg"}`;
    await storage.upload(STORAGE_BUCKETS.avatars, avatarPath, avatarFile);
    avatarUrl = storage.getPublicUrl(STORAGE_BUCKETS.avatars, avatarPath) ?? undefined;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      username,
      bio,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { error: "Esse nome de usuário já está em uso" };
    return { error: "Não foi possível salvar as alterações" };
  }

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.profile);
  return { success: true };
}

export interface PasswordActionState {
  error?: string;
  success?: boolean;
}

export async function updatePassword(
  _prevState: PasswordActionState,
  formData: FormData
): Promise<PasswordActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Não foi possível alterar a senha. Tente novamente." };

  return { success: true };
}
