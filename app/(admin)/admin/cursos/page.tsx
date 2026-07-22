import type { Metadata } from "next";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Cursos" };

export default function AdminCoursesPage() {
  return (
    <EmptyState
      icon={Construction}
      title="Em construção"
      description="Agrupar vídeos em cursos estruturados (com módulos e ordem) está planejado no ROADMAP.md. Por enquanto, professores organizam aulas por canal e playlists."
    />
  );
}
