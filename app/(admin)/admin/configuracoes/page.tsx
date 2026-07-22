import type { Metadata } from "next";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Configurações da plataforma" };

export default function AdminSettingsPage() {
  return (
    <EmptyState
      icon={Construction}
      title="Em construção"
      description="Configurações globais (nome da plataforma, políticas de moderação, integração de pagamento) ficam para uma próxima iteração. Veja o ROADMAP.md."
    />
  );
}
