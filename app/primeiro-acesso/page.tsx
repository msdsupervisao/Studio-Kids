import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { OnboardingWizard } from "@/features/onboarding/components/OnboardingWizard";
import { TunnelBackground } from "@/features/onboarding/components/TunnelBackground";
import { APP_NAME, ROUTES } from "@/lib/constants";

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
    <div className="relative isolate flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 py-12">
      <TunnelBackground />
      <Link href={ROUTES.home} className="relative z-10 mb-8">
        <span
          className="font-fredoka text-4xl font-semibold tracking-tight text-white sm:text-5xl"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}
        >
          {APP_NAME}
        </span>
      </Link>
      <OnboardingWizard fullName={profile?.full_name ?? "você"} />
    </div>
  );
}
