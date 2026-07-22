import {
  BarChart3,
  CheckSquare,
  Clock3,
  FolderCog,
  Heart,
  History,
  Home,
  LayoutGrid,
  LibraryBig,
  ListVideo,
  Rss,
  Settings,
  Shield,
  Tags,
  Upload,
  Users,
  Video,
  Zap,
  Tv,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// A secao "Inscricoes" e renderizada separadamente pelo Sidebar (com a
// lista de canais inscritos do usuario, buscada dinamicamente) — aqui fica
// so o link para a pagina.
export const APP_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Início", href: ROUTES.home, icon: Home },
      { label: "Shorts", href: ROUTES.shorts, icon: Zap },
      { label: "Explorar", href: ROUTES.explore, icon: LayoutGrid },
    ],
  },
  {
    title: "Inscrições",
    items: [{ label: "Inscrições", href: ROUTES.subscriptions, icon: Rss }],
  },
  {
    title: "Você",
    items: [
      { label: "Biblioteca", href: ROUTES.library, icon: LibraryBig },
      { label: "Meu canal", href: ROUTES.myChannel, icon: Tv },
      { label: "Histórico", href: ROUTES.history, icon: History },
      { label: "Playlists", href: ROUTES.playlists, icon: ListVideo },
      { label: "Ver mais tarde", href: ROUTES.watchLater, icon: Clock3 },
      { label: "Vídeos curtidos", href: ROUTES.liked, icon: Heart },
    ],
  },
];

export const PROFESSOR_NAV_ITEMS: NavItem[] = [
  { label: "Visão geral", href: ROUTES.professor, icon: BarChart3 },
  { label: "Meus vídeos", href: ROUTES.professorVideos, icon: Video },
  { label: "Canais", href: ROUTES.professorChannels, icon: FolderCog },
  { label: "Enviar vídeo", href: ROUTES.upload, icon: Upload },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Visão geral", href: ROUTES.admin, icon: Shield },
  { label: "Moderação", href: ROUTES.adminUploads, icon: CheckSquare },
  { label: "Categorias", href: ROUTES.adminCategories, icon: Tags },
  { label: "Usuários", href: ROUTES.adminUsers, icon: Users },
  { label: "Configurações", href: ROUTES.adminSettings, icon: Settings },
];
