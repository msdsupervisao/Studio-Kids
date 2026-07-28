import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { TunnelBackground } from "@/components/shared/TunnelBackground";
import { Globe } from "@/components/shared/Globe";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Entrar" };

const GLOBE_PROPS = {
  speed: 1.5,
  scale: 7,
  detail: 3,
  showGrid: false,
  oceanColor: "rgba(0,0,0,0)",
  outlineColor: "#ffffff",
  outlineWidth: 1.5,
  dots: { color: "#ffffff", size: 3, density: 6, allDots: false },
  stopOnHover: false,
} as const;

export default function LoginPage() {
  return (
    <div className="relative isolate flex min-h-[70vh] w-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
      <TunnelBackground />
      <div className="relative z-10 mb-8 flex items-center gap-1 sm:gap-3">
        <div className="h-16 w-16 sm:h-20 sm:w-20">
          <Globe {...GLOBE_PROPS} direction="right" />
        </div>
        <span
          className="font-fredoka text-4xl font-semibold tracking-tight text-white sm:text-5xl"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}
        >
          {APP_NAME}
        </span>
        <div className="h-16 w-16 sm:h-20 sm:w-20">
          <Globe {...GLOBE_PROPS} direction="left" />
        </div>
      </div>
      <LoginForm />
    </div>
  );
}
