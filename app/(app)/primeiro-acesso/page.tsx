import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { OnboardingWizard } from "@/features/onboarding/components/OnboardingWizard";
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
    <div className="flex min-h-[70vh] items-center justify-center">
      <OnboardingWizard fullName={profile?.full_name ?? "voce"} />
    </div>
  );
}
