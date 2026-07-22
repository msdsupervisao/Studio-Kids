import type { Metadata } from "next";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Turmas" };

export default function AdminClassesPage() {
  return (
    <EmptyState
      icon={Construction}
      title="Em construção"
      description="Turmas fechadas (uso institucional) não fazem parte do MVP de marketplace aberto. Veja o ROADMAP.md."
    />
  );
}
