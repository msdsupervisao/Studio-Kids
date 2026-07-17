import type { Metadata } from "next";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Configuracoes da plataforma" };

export default function AdminSettingsPage() {
  return (
    <EmptyState
      icon={Construction}
      title="Em construcao"
      description="Configuracoes globais (nome da plataforma, politicas de moderacao, integracao de pagamento) ficam para uma proxima iteracao. Veja o ROADMAP.md."
    />
  );
}
