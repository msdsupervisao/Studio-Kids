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
  // O contorno dos continentes desenha uma malha 3D (TubeGeometry) separada
  // para cada trecho de cada litoral do planeta — milhares de draw calls
  // por globo. Pesado demais pra um icone decorativo de ~80px, ainda mais
  // com dois globos rodando ao mesmo tempo que o tunel. So os pontos (uma
  // unica malha instanciada) ja dao a leitura do globo por um custo bem menor.
  showOutline: false,
  dots: { color: "#ffffff", size: 3, density: 6, allDots: false },
  stopOnHover: false,
} as const;

export default function LoginPage() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="relative isolate flex min-h-[70vh] w-full flex-col items-center justify-center overflow-hidden">
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
    </div>
  );
}
