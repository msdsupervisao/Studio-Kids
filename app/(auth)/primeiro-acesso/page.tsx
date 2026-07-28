import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { OnboardingWizard } from "@/features/onboarding/components/OnboardingWizard";
import { TunnelBackground } from "@/features/onboarding/components/TunnelBackground";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Bem-vindo" };

export default async function FirstAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(ROUTES.login);

  const { data: profile } = await supabase.from("profiles").select("full_name, onboarding_completed_at").eq("id", user.id).single();
  if (profile?.onboarding_completed_at) redirect(ROUTES.home);

  return (
    <div className="relative isolate flex min-h-[70vh] w-full items-center justify-center overflow-hidden">
      <TunnelBackground />
      <OnboardingWizard fullName={profile?.full_name ?? "você"} />
    </div>
  );
}
