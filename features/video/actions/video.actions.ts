"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { STORAGE_BUCKETS, PAGE_SIZE, ROUTES } from "@/lib/constants";
import { slugify } from "@/utils/slug";
import { sanitizeMultilineText, sanitizePlainText } from "@/utils/sanitize";
import type { VideoCardData, VideoPlaybackData, VideoStatus } from "@/types/video.types";

const VIDEO_CARD_SELECT = `
  id, slug, title, thumbnail_path, duration_seconds, views_count, published_at,
  channel:channels ( slug, name, avatar_url )
`;

type VideoCardRow = {
  id: string;
  slug: string;
  title: string;
  thumbnail_path: string | null;
  duration_seconds: number;
  views_count: number;
  published_at: string | null;
  channel: { slug: string; name: string; avatar_url: string | null } | null;
};

function toVideoCardData(
  row: VideoCardRow,
  getThumbnailUrl: (path: string | null) => string | null
): VideoCardData {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    thumbnailUrl: getThumbnailUrl(row.thumbnail_path),
    durationSeconds: row.duration_seconds,
    viewsCount: row.views_count,
    publishedAt: row.published_at,
    channel: {
      slug: row.channel?.slug ?? "",
      name: row.channel?.name ?? "Canal removido",
      avatarUrl: row.channel?.avatar_url ?? null,
    },
  };
}

export async function listPublishedVideos(options: { limit?: number; categorySlug?: string } = {}) {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  let query = supabase
    .from("videos")
    .select(VIDEO_CARD_SELECT)
    .eq("status", "published")
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
  if (error) throw new Error(`Falha ao carregar videos: ${error.message}`);

  return (data ?? []).map((row) => toVideoCardData(row, (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path)));
}

export async function searchVideos(query: string) {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_CARD_SELECT)
    .eq("status", "published")
    .ilike("title", `%${query}%`)
    .order("views_count", { ascending: false })
    .limit(PAGE_SIZE.search)
    .overrideTypes<VideoCardRow[]>();

  if (error) throw new Error(`Falha na busca: ${error.message}`);
  return (data ?? []).map((row) => toVideoCardData(row, (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path)));
}

export async function listVideosByChannel(channelId: string) {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  // RLS decide o que aparece: publicados para qualquer um, todos os
  // status para o dono do canal ou admin.
  const { data, error } = await supabase
    .from("videos")
    .select(`${VIDEO_CARD_SELECT}, status`)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .overrideTypes<Array<VideoCardRow & { status: VideoStatus }>>();

  if (error) throw new Error(`Falha ao carregar videos do canal: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...toVideoCardData(row, (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path)),
    status: row.status,
  }));
}

export async function listPendingVideos() {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data, error } = await supabase
    .from("videos")
    .select(`${VIDEO_CARD_SELECT}, status`)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .overrideTypes<Array<VideoCardRow & { status: VideoStatus }>>();

  if (error) throw new Error(`Falha ao carregar videos pendentes: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...toVideoCardData(row, (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path)),
    status: row.status,
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
    channel: data.channel,
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
    .eq("channel_id", channelId)
    .neq("id", videoId)
    .order("published_at", { ascending: false })
    .limit(8)
    .overrideTypes<VideoCardRow[]>();

  if (error) throw new Error(`Falha ao carregar videos relacionados: ${error.message}`);
  return (data ?? []).map((row) => toVideoCardData(row, (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path)));
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
}

export async function uploadVideo(input: UploadVideoInput) {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessao expirada. Faca login novamente.");

  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      channel_id: input.channelId,
      category_id: input.categoryId,
      title: sanitizePlainText(input.title),
      slug: slugify(input.title),
      description: input.description ? sanitizeMultilineText(input.description) : null,
      video_path: "",
      duration_seconds: input.durationSeconds,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !video) {
    throw new Error(`Falha ao criar video: ${insertError?.message ?? "erro desconhecido"}`);
  }

  const videoExtension = input.videoFile.name.split(".").pop() ?? "mp4";
  const videoPath = `${input.channelId}/${video.id}.${videoExtension}`;
  await storage.upload(STORAGE_BUCKETS.videos, videoPath, input.videoFile);

  let thumbnailPath: string | null = null;
  if (input.thumbnailFile) {
    const thumbExtension = input.thumbnailFile.name.split(".").pop() ?? "jpg";
    thumbnailPath = `${input.channelId}/${video.id}.${thumbExtension}`;
    await storage.upload(STORAGE_BUCKETS.thumbnails, thumbnailPath, input.thumbnailFile);
  }

  const { error: updateError } = await supabase
    .from("videos")
    .update({ video_path: videoPath, thumbnail_path: thumbnailPath })
    .eq("id", video.id);

  if (updateError) throw new Error(`Falha ao finalizar upload: ${updateError.message}`);

  revalidatePath(ROUTES.professorVideos);
  return { videoId: video.id as string };
}

export async function updateVideoStatus(videoId: string, status: VideoStatus, rejectionReason?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .update({
      status,
      rejection_reason: status === "rejected" ? (rejectionReason ?? null) : null,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", videoId);

  if (error) throw new Error(`Falha ao atualizar status do video: ${error.message}`);
  revalidatePath(ROUTES.adminUploads);
  revalidatePath(ROUTES.professorVideos);
}

export async function deleteVideo(videoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("videos").delete().eq("id", videoId);
  if (error) throw new Error(`Falha ao remover video: ${error.message}`);
  revalidatePath(ROUTES.professorVideos);
}
