import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-sm font-medium text-primary">Erro 404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Essa página não existe
      </h1>
      <p className="max-w-sm text-muted-foreground">
        O conteúdo pode ter sido removido ou o endereço está incorreto.
      </p>
      <Link
        href={ROUTES.home}
        className="focus-ring mt-2 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
