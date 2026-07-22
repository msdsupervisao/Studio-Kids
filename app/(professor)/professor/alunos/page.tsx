import type { Metadata } from "next";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Alunos" };

export default function ProfessorStudentsPage() {
  return (
    <EmptyState
      icon={Construction}
      title="Em construção"
      description="Em breve você verá aqui quem se inscreveu no seu canal e o progresso deles nas suas aulas. Veja o ROADMAP.md para o planejamento."
    />
  );
}
