import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Sobre" };

const PILLARS = [
  {
    emoji: "🎬",
    title: "Experiência Completa",
    text: "Vivencie praticamente todas as funcionalidades de uma plataforma de vídeos moderna, aprendendo na prática como criar, organizar e gerenciar um canal do início ao fim.",
  },
  {
    emoji: "🤖",
    title: "Criatividade com Inteligência Artificial",
    text: "Crie logotipos, banners, miniaturas, descrições, títulos e roteiros utilizando Inteligência Artificial integrada às atividades do curso.",
  },
  {
    emoji: "🛡️",
    title: "Ambiente Seguro",
    text: "Todos os conteúdos permanecem dentro da plataforma, proporcionando um ambiente controlado para aprendizado, prática e acompanhamento pelos professores.",
  },
  {
    emoji: "🚀",
    title: "Preparação para o Mundo Real",
    text: "Quando o aluno dominar todas as ferramentas, estará pronto para migrar seu conhecimento para plataformas reais, levando consigo toda a experiência adquirida durante o curso.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sobre o {APP_NAME}</h1>
        <p className="text-muted-foreground">Aprenda a ser um criador de conteúdo em um ambiente seguro.</p>
      </div>

      <div className="space-y-4 text-sm text-foreground">
        <p>
          O {APP_NAME} é um simulador educacional desenvolvido para ensinar crianças e adolescentes a utilizar o
          YouTube de forma prática, segura e divertida.
        </p>
        <p>
          Aqui cada aluno possui seu próprio canal, onde pode criar sua identidade visual, personalizar banner, foto
          de perfil, playlists, miniaturas, publicar vídeos, organizar conteúdos e aprender todas as ferramentas que
          fazem parte da rotina de um criador de conteúdo.
        </p>
        <p>
          Toda a experiência acontece em um ambiente privado da escola, sem a necessidade de criar contas Google,
          utilizar números de telefone ou publicar vídeos na internet.
        </p>
        <p>
          Nosso objetivo é que, ao concluir o curso, o aluno esteja preparado para criar e administrar um canal real
          com autonomia e responsabilidade.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="space-y-2 rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">
              <span aria-hidden>{pillar.emoji}</span> {pillar.title}
            </p>
            <p className="text-sm text-muted-foreground">{pillar.text}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {APP_NAME} é um projeto educacional desenvolvido por Fernando Padova para a MSD Educação Profissional, com o
        objetivo de transformar o ensino de produção de conteúdo digital em uma experiência prática, segura e
        inovadora para crianças e adolescentes.
      </p>
    </div>
  );
}
