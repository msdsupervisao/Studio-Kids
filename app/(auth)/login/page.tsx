import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { TunnelBackground } from "@/components/shared/TunnelBackground";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="relative isolate flex min-h-[70vh] w-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
      <TunnelBackground />
      <span
        className="relative z-10 mb-8 font-fredoka text-4xl font-semibold tracking-tight text-white sm:text-5xl"
        style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}
      >
        {APP_NAME}
      </span>
      <LoginForm />
    </div>
  );
}
