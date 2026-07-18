import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Configuracoes" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect(ROUTES.login);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Configuracoes</h1>
      <ProfileSettingsForm profile={profile} />

      <div className="max-w-md border-t border-border pt-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Senha</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
