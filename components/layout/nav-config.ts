import {
  BarChart3,
  CheckSquare,
  FolderCog,
  Home,
  LayoutGrid,
  ListVideo,
  Settings,
  Shield,
  Tags,
  Upload,
  Users,
  Video,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof Home;
}

export const APP_NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: ROUTES.home, icon: Home },
  { label: "Explorar", href: ROUTES.explore, icon: LayoutGrid },
  { label: "Playlists", href: ROUTES.playlists, icon: ListVideo },
];

export const PROFESSOR_NAV_ITEMS: NavItem[] = [
  { label: "Visao geral", href: ROUTES.professor, icon: BarChart3 },
  { label: "Meus videos", href: ROUTES.professorVideos, icon: Video },
  { label: "Canais", href: ROUTES.professorChannels, icon: FolderCog },
  { label: "Enviar video", href: ROUTES.upload, icon: Upload },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Visao geral", href: ROUTES.admin, icon: Shield },
  { label: "Moderacao", href: ROUTES.adminUploads, icon: CheckSquare },
  { label: "Categorias", href: ROUTES.adminCategories, icon: Tags },
  { label: "Usuarios", href: ROUTES.adminUsers, icon: Users },
  { label: "Configuracoes", href: ROUTES.adminSettings, icon: Settings },
];
