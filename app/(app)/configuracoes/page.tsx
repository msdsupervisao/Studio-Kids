import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";
import { ProfileSettingsForm } from "./ProfileSettingsForm";

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
    </div>
  );
}
