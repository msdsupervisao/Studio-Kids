"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { channelSchema } from "@/lib/validations";
import { sanitizePlainText } from "@/utils/sanitize";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/user.types";

export interface OnboardingState {
  error?: string;
}

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const role = formData.get("role") as UserRole;
  if (role !== "student" && role !== "professor") {
    return { error: "Selecione um perfil" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessao expirada. Faca login novamente." };

  if (role === "professor") {
    const parsedChannel = channelSchema.safeParse({
      name: formData.get("channelName"),
      slug: formData.get("channelSlug"),
    });
    if (!parsedChannel.success) {
      return { error: parsedChannel.error.issues[0]?.message ?? "Dados do canal invalidos" };
    }

    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role: "professor", onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    if (roleError) return { error: "Nao foi possivel concluir seu cadastro" };

    const { error: channelError } = await supabase.from("channels").insert({
      owner_id: user.id,
      name: sanitizePlainText(parsedChannel.data.name),
      slug: parsedChannel.data.slug,
    });
    if (channelError) {
      if (channelError.code === "23505") return { error: "Ja existe um canal com esse endereco" };
      return { error: "Nao foi possivel criar seu canal" };
    }
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "student", onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) return { error: "Nao foi possivel concluir seu cadastro" };
  }

  redirect(ROUTES.home);
}
