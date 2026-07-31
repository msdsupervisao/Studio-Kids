import Link from "next/link";
import { ROUTES } from "@/lib/constants";

// Fixo em toda pagina (fora do AppShell, direto no layout raiz) — inclusive
// login, admin, professor. pointer-events-none no wrapper + auto so no
// texto evita bloquear cliques no resto da tela.
export function Footer() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-1 sm:justify-start sm:pl-3">
      <p className="pointer-events-auto rounded-md bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground backdrop-blur-sm">
        <Link href={ROUTES.about} className="hover:text-foreground hover:underline">
          Sobre
        </Link>
        {" · "}© 2026 Fernando Padova
      </p>
    </div>
  );
}
