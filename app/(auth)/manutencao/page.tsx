import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Em manutenção" };

export default function MaintenancePage() {
  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Wrench className="h-7 w-7" />
      </div>
      <span className="font-fredoka text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
        {APP_NAME}
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">Voltamos já!</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Estamos migrando para um servidor melhor, com mais espaço para os vídeos das aulas. O site fica fora do ar só
        por um tempinho — obrigado pela paciência!
      </p>
    </div>
  );
}
