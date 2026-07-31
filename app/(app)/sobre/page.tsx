import type { Metadata } from "next";
import { BookOpen, Heart, Shield, Sparkles } from "lucide-react";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Sobre" };

const PILLARS = [
  {
    icon: BookOpen,
    title: "Aprender no próprio ritmo",
    text: "Aulas em vídeo organizadas por categoria, para o aluno assistir, rever e voltar quando quiser.",
  },
  {
    icon: Sparkles,
    title: "Feito para criar",
    text: "Professores publicam aulas e vídeos curtos, e turmas acompanham o que sai de novo em cada canal.",
  },
  {
    icon: Heart,
    title: "Comunidade da turma",
    text: "Comentários, curtidas, playlists e inscrições — a mesma dinâmica de vídeo que os alunos já conhecem, num ambiente da escola.",
  },
  {
    icon: Shield,
    title: "Pensado para criança",
    text: "Vídeos passam por aprovação antes de ficar visíveis, e contas são geridas pela própria escola.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sobre o {APP_NAME}</h1>
        <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="space-y-2 rounded-xl border border-border p-4">
            <pillar.icon className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">{pillar.title}</p>
            <p className="text-sm text-muted-foreground">{pillar.text}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {APP_NAME} é desenvolvido e mantido por Fernando Padova.
      </p>
    </div>
  );
}
