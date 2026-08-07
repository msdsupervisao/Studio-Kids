export const APP_NAME = "Studio Kids";
export const APP_DESCRIPTION =
  "A plataforma onde professores publicam aulas em vídeo e alunos aprendem no seu ritmo.";

export const ROUTES = {
  home: "/inicio",
  explore: "/explorar",
  shorts: "/shorts",
  short: (id: string) => `/shorts/${id}`,
  search: "/pesquisa",
  about: "/sobre",
  login: "/login",
  forgotPassword: "/esqueci-senha",
  maintenance: "/manutencao",
  firstAccess: "/primeiro-acesso",
  profile: "/perfil",
  settings: "/configuracoes",
  notifications: "/notificacoes",
  subscriptions: "/inscricoes",
  playlists: "/playlists",
  playlist: (id: string) => `/playlists/${id}`,
  newPlaylist: "/playlists/nova",
  library: "/biblioteca",
  history: "/historico",
  liked: "/curtidos",
  watchLater: "/mais-tarde",
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
  maxVideoSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB — teto do bucket "videos" em si
  // O plano Free do Supabase aplica um limite de upload por arquivo bem
  // menor que isso, valido pro projeto inteiro, independente do que o
  // bucket permite (visto na pratica: bucket configurado pra 2GB, upload
  // de video real barrado com "exceeded the maximum allowed size"). Ajustar
  // aqui se o projeto virar plano Pro (que permite configurar um limite
  // maior no painel do Supabase).
  maxEffectiveVideoUploadBytes: 50 * 1024 * 1024, // 50MB
  maxThumbnailSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedVideoTypes: ["video/mp4", "video/webm", "video/quicktime"],
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  shortMaxDurationSeconds: 60,
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
  postImages: "post-images",
} as const;

/**
 * Qual provedor guarda os arquivos enviados (video, miniatura, avatar...).
 * "supabase" (padrao) usa o Supabase Storage de sempre; "r2" usa Cloudflare
 * R2 (ver services/storage/r2.ts) — trocar so muda esta env var + as
 * credenciais do R2 no .env, nenhum outro codigo precisa mudar. Publica
 * (NEXT_PUBLIC_) porque o navegador precisa saber pra onde mandar o
 * arquivo direto (upload nao passa pelo nosso servidor).
 */
export const STORAGE_PROVIDER: "supabase" | "r2" =
  process.env.NEXT_PUBLIC_STORAGE_PROVIDER === "r2" ? "r2" : "supabase";

/**
 * R2 nao tem um teto real de espaco (cobra por GB usado, sem bloquear nada
 * ao ultrapassar) — este numero e so uma referencia pro painel admin saber
 * quanto % do "orcamento" ja foi usado. Padrao 10GB = tier gratis do R2;
 * ajustar essa env var se contratar mais espaco.
 */
export const STORAGE_QUOTA_GB = Number(process.env.STORAGE_QUOTA_GB) || 10;
