export const APP_NAME = "Studio Kids";
export const APP_DESCRIPTION =
  "A plataforma onde professores publicam aulas em video e alunos aprendem no seu ritmo.";

export const ROUTES = {
  home: "/inicio",
  explore: "/explorar",
  shorts: "/shorts",
  short: (id: string) => `/shorts/${id}`,
  search: "/pesquisa",
  login: "/login",
  forgotPassword: "/esqueci-senha",
  firstAccess: "/primeiro-acesso",
  profile: "/perfil",
  settings: "/configuracoes",
  notifications: "/notificacoes",
  playlists: "/playlists",
  newPlaylist: "/playlists/nova",
  library: "/biblioteca",
  history: "/historico",
  liked: "/curtidos",
  upload: "/upload",
  myChannel: "/meu-canal",
  editMyChannel: "/meu-canal/editar",
  stats: "/estatisticas",
  channel: (slug: string) => `/canal/${slug}`,
  video: (id: string) => `/video/${id}`,
  professor: "/professor",
  professorVideos: "/professor/videos",
  professorVideoEdit: (id: string) => `/professor/videos/${id}/editar`,
  professorStudents: "/professor/alunos",
  professorApprovals: "/professor/aprovacoes",
  professorChannels: "/professor/canais",
  admin: "/admin",
  adminUsers: "/admin/usuarios",
  adminCourses: "/admin/cursos",
  adminClasses: "/admin/turmas",
  adminCategories: "/admin/categorias",
  adminUploads: "/admin/uploads",
  adminStorage: "/admin/storage",
  adminSettings: "/admin/configuracoes",
} as const;

export const UPLOAD_LIMITS = {
  maxVideoSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
  maxThumbnailSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedVideoTypes: ["video/mp4", "video/webm", "video/quicktime"],
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const PAGE_SIZE = {
  videoGrid: 24,
  comments: 20,
  search: 20,
} as const;

export const STORAGE_BUCKETS = {
  videos: "videos",
  thumbnails: "thumbnails",
  avatars: "avatars",
  banners: "banners",
} as const;
