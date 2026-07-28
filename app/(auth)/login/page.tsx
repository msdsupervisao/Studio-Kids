import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { TunnelBackground } from "@/components/shared/TunnelBackground";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="relative isolate flex min-h-[70vh] w-full items-center justify-center overflow-hidden">
      <TunnelBackground />
      <LoginForm />
    </div>
  );
}
