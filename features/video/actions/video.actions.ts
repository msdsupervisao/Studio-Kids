"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { STORAGE_BUCKETS, PAGE_SIZE, ROUTES } from "@/lib/constants";
import { slugify } from "@/utils/slug";
import { sanitizeMultilineText, sanitizePlainText } from "@/utils/sanitize";
import { createDraftVideoSchema, updateVideoSchema, videoModerationSchema } from "@/lib/validations";
import {
  VIDEO_CARD_SELECT,
  getLikesCountMap,
  toVideoCardData,
  type VideoCardRow,
} from "@/features/video/lib/video-card.mapper";
import type { VideoPlaybackData, VideoStatus } from "@/types/video.types";

export async function listPublishedVideos(options: { limit?: number; categorySlug?: string } = {}) {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  let query = supabase
    .from("videos")
    .select(VIDEO_CARD_SELECT)
    .eq("status", "published")
    .eq("is_short", false)
    .order("published_at", { ascending: false })
    .limit(options.limit ?? PAGE_SIZE.videoGrid);

  if (options.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .single();
    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  const { data, error } = await query.overrideTypes<VideoCardRow[]>();
  if (error) throw new Error(`Falha ao carregar vídeos: ${error.message}`);

  const rows = data ?? [];
  const likesByVideo = await getLikesCountMap(supabase, rows.map((row) => row.id));

  return rows.map((row) =>
    toVideoCardData(
      row,
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path),
      likesByVideo.get(row.id) ?? 0
    )
  );
}

export async function searchVideos(query: string) {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_CARD_SELECT)
    .eq("status", "published")
    .eq("is_short", false)
    .ilike("title", `%${query}%`)
    .order("views_count", { ascending: false })
    .limit(PAGE_SIZE.search)
    .overrideTypes<VideoCardRow[]>();

  if (error) throw new Error(`Falha na busca: ${error.message}`);
  const rows = data ?? [];
  const likesByVideo = await getLikesCountMap(supabase, rows.map((row) => row.id));
  return rows.map((row) =>
    toVideoCardData(
      row,
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path),
      likesByVideo.get(row.id) ?? 0
    )
  );
}

export async function listVideosByChannel(channelId: string) {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  // RLS decide o que aparece: publicados para qualquer um, todos os
  // status para o dono do canal ou admin.
  const { data, error } = await supabase
    .from("videos")
    .select(`${VIDEO_CARD_SELECT}, status, is_short`)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .overrideTypes<Array<VideoCardRow & { status: VideoStatus; is_short: boolean }>>();

  if (error) throw new Error(`Falha ao carregar vídeos do canal: ${error.message}`);
  const rows = data ?? [];
  const likesByVideo = await getLikesCountMap(supabase, rows.map((row) => row.id));
  return rows.map((row) => ({
    ...toVideoCardData(
      row,
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path),
      likesByVideo.get(row.id) ?? 0
    ),
    status: row.status,
    isShort: row.is_short,
  }));
}

export async function listPendingVideos() {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data, error } = await supabase
    .from("videos")
    .select(`${VIDEO_CARD_SELECT}, status, video_path`)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .overrideTypes<Array<VideoCardRow & { status: VideoStatus; video_path: string }>>();

  if (error) throw new Error(`Falha ao carregar vídeos pendentes: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...toVideoCardData(
      row,
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path)
    ),
    status: row.status,
    // O upload grava o arquivo em duas etapas (rascunho -> envio ao Storage
    // -> finalizeVideoUpload grava o path); se o navegador fechar ou a
    // conexao cair no meio, sobra um registro "pendente" sem arquivo de
    // verdade. Sinaliza pro admin em vez de deixar aprovar um video mudo.
    hasFile: row.video_path !== "",
  }));
}

export async function getVideoDetail(id: string): Promise<VideoPlaybackData | null> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data: userResult } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("videos")
    .select(
      `*, channel:channels ( id, owner_id, name, slug, avatar_url, banner_url, description, created_at, updated_at )`
    )
    .eq("id", id)
    .single();

  if (error || !data || !data.channel) return null;

  let subscribersCount = 0;
  let isSubscribed = false;
  {
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("channel_id", data.channel.id);
    subscribersCount = count ?? 0;
  }
  if (userResult.user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("channel_id")
      .eq("channel_id", data.channel.id)
      .eq("subscriber_id", userResult.user.id)
      .maybeSingle();
    isSubscribed = Boolean(sub);
  }

  if (data.status === "published") {
    await supabase.rpc("increment_video_views", { video_id_input: id });
  }

  return {
    ...data,
    channel: {
      ...data.channel,
      avatar_url: storage.getPublicUrl(STORAGE_BUCKETS.avatars, data.channel.avatar_url),
    },
    videoUrl: storage.getPublicUrl(STORAGE_BUCKETS.videos, data.video_path) ?? "",
    thumbnailUrl: storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, data.thumbnail_path),
    isSubscribed,
    subscribersCount,
  };
}

export async function getRelatedVideos(videoId: string, channelId: string) {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_CARD_SELECT)
    .eq("status", "published")
    .eq("is_short", false)
    .eq("channel_id", channelId)
    .neq("id", videoId)
    .order("published_at", { ascending: false })
    .limit(8)
    .overrideTypes<VideoCardRow[]>();

  if (error) throw new Error(`Falha ao carregar vídeos relacionados: ${error.message}`);
  const rows = data ?? [];
  const likesByVideo = await getLikesCountMap(supabase, rows.map((row) => row.id));
  return rows.map((row) =>
    toVideoCardData(
      row,
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path),
      likesByVideo.get(row.id) ?? 0
    )
  );
}

export async function listCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw new Error(`Falha ao carregar categorias: ${error.message}`);
  return data ?? [];
}

export interface UploadVideoInput {
  channelId: string;
  title: string;
  description: string;
  categoryId: string | null;
  videoFile: File;
  thumbnailFile: File | null;
  durationSeconds: number;
  isShort?: boolean;
}

type CreateDraftVideoInput = Omit<UploadVideoInput, "videoFile" | "thumbnailFile">;

/**
 * Cria a linha do video sem o arquivo (payload de texto, seguro para
 * Server Action). O arquivo em si e enviado direto do navegador para o
 * Supabase Storage (ver hooks/use-upload.ts) — mandar um video de ate 2GB
 * como argumento de Server Action e instavel, o parser multipart do
 * Next.js trunca streams grandes com "Unexpected end of form".
 */
export async function createDraftVideo(input: CreateDraftVideoInput) {
  const parsed = createDraftVideoSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados do vídeo inválidos");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Sessão expirada. Faça login novamente.");

    const baseSlug = slugify(parsed.data.title);

    // Uma tentativa de upload que falha no meio do caminho (rede caiu,
    // arquivo grande demais, compressao travou) deixa um rascunho
    // "pendente" sem arquivo pra tras. Sem isso, uma nova tentativa com o
    // MESMO titulo esbarra sempre no mesmo slug ja usado (unique
    // constraint "videos_channel_slug_unique") e trava a pessoa pra
    // sempre, com um erro 500 sem mensagem clara do motivo real. Rascunho
    // abandonado (sem arquivo) do mesmo canal e slug e sempre seguro de
    // substituir.
    const { data: staleDraft } = await supabase
      .from("videos")
      .select("id")
      .eq("channel_id", parsed.data.channelId)
      .eq("slug", baseSlug)
      .eq("video_path", "")
      .maybeSingle();
    if (staleDraft) {
      await supabase.from("videos").delete().eq("id", staleDraft.id);
    }

    const insertVideo = (slug: string) =>
      supabase
        .from("videos")
        .insert({
          channel_id: parsed.data.channelId,
          category_id: parsed.data.categoryId,
          title: sanitizePlainText(parsed.data.title),
          slug,
          description: parsed.data.description ? sanitizeMultilineText(parsed.data.description) : null,
          video_path: "",
          duration_seconds: parsed.data.durationSeconds,
          is_short: parsed.data.isShort ?? false,
          status: "pending",
        })
        .select("id")
        .single();

    let { data: video, error } = await insertVideo(baseSlug);
    if (error?.code === "23505") {
      // Colidiu com um video de verdade (com arquivo) do mesmo canal e
      // titulo — desambigua em vez de travar a pessoa com um erro opaco.
      ({ data: video, error } = await insertVideo(`${baseSlug}-${Date.now().toString(36)}`));
    }

    if (error || !video) throw new Error(`Falha ao criar vídeo: ${error?.message ?? "erro desconhecido"}`);
    return { videoId: video.id as string };
  } catch (err) {
    // O Next.js esconde a mensagem de qualquer excecao nao prevista numa
    // Server Action em producao (so mostra um "digest" generico pro
    // cliente) — sem logar aqui, uma falha de rede/conexao inesperada
    // (diferente dos `throw new Error` de validacao acima, que sao
    // esperados) desaparece sem deixar pista nenhuma.
    console.error("[createDraftVideo] falha inesperada:", err);
    throw err;
  }
}

export async function finalizeVideoUpload(videoId: string, videoPath: string, thumbnailPath: string | null) {
  if (!/^[0-9a-f-]{36}$/i.test(videoId) || !videoPath || (thumbnailPath !== null && !thumbnailPath)) {
    throw new Error("Dados de upload inválidos");
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("videos")
      .update({ video_path: videoPath, thumbnail_path: thumbnailPath })
      .eq("id", videoId);

    if (error) throw new Error(`Falha ao finalizar upload: ${error.message}`);
    revalidatePath(ROUTES.professorVideos);
  } catch (err) {
    console.error("[finalizeVideoUpload] falha inesperada:", err);
    throw err;
  }
}

export async function updateVideoStatus(videoId: string, status: VideoStatus, rejectionReason?: string) {
  const parsed = videoModerationSchema.safeParse({ videoId, status, rejectionReason });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados de moderação inválidos");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");
  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || !isAdmin) throw new Error("Apenas administradores podem moderar vídeos.");

  if (parsed.data.status === "published") {
    const { data: video } = await supabase.from("videos").select("video_path").eq("id", videoId).single();
    if (!video?.video_path) {
      throw new Error("Este vídeo não tem arquivo enviado (upload incompleto) e não pode ser publicado.");
    }
  }

  const { error } = await supabase
    .from("videos")
    .update({
      status: parsed.data.status,
      rejection_reason: parsed.data.status === "rejected" ? (parsed.data.rejectionReason ?? null) : null,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", videoId);

  if (error) throw new Error(`Falha ao atualizar status do vídeo: ${error.message}`);
  revalidatePath(ROUTES.adminUploads);
  revalidatePath(ROUTES.professorVideos);
}

export async function deleteVideo(videoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) throw new Error(`Falha ao remover vídeo: ${error.message}`);
  revalidatePath(ROUTES.professorVideos);
}

export interface VideoForEdit {
  id: string;
  channelId: string;
  categoryId: string | null;
  title: string;
  description: string;
  thumbnailUrl: string | null;
}

/** Retorna null se o video nao existe ou o usuario nao e dono do canal / admin. */
export async function getVideoForEdit(videoId: string): Promise<VideoForEdit | null> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("videos")
    .select("id, channel_id, category_id, title, description, thumbnail_path")
    .eq("id", videoId)
    .single();
  if (error || !data) return null;

  const [{ data: isAdmin }, { data: ownsChannel }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("owns_channel", { channel_id_input: data.channel_id }),
  ]);
  if (!isAdmin && !ownsChannel) return null;

  return {
    id: data.id,
    channelId: data.channel_id,
    categoryId: data.category_id,
    title: data.title,
    description: data.description ?? "",
    thumbnailUrl: storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, data.thumbnail_path),
  };
}

export interface UpdateVideoInput {
  title: string;
  description: string;
  categoryId: string | null;
}

export async function updateVideo(videoId: string, input: UpdateVideoInput) {
  const parsed = updateVideoSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados do vídeo inválidos");

  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .update({
      title: sanitizePlainText(parsed.data.title),
      slug: slugify(parsed.data.title),
      description: parsed.data.description ? sanitizeMultilineText(parsed.data.description) : null,
      category_id: parsed.data.categoryId,
    })
    .eq("id", videoId);

  if (error) throw new Error(`Falha ao salvar alterações: ${error.message}`);
  revalidatePath(ROUTES.professorVideos);
  revalidatePath(ROUTES.video(videoId));
}

export async function updateVideoThumbnail(videoId: string, thumbnailPath: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("videos").update({ thumbnail_path: thumbnailPath }).eq("id", videoId);
  if (error) throw new Error(`Falha ao atualizar miniatura: ${error.message}`);
  revalidatePath(ROUTES.professorVideos);
  revalidatePath(ROUTES.video(videoId));
}
