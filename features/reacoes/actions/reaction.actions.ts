"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { STORAGE_BUCKETS, ROUTES } from "@/lib/constants";
import { VIDEO_CARD_SELECT, toVideoCardData, type VideoCardRow } from "@/features/video/lib/video-card.mapper";
import type { VideoCardData } from "@/types/video.types";
import type { VideoReactionType } from "@/types/database.types";

export interface VideoReactionSummary {
  likesCount: number;
  dislikesCount: number;
  userReaction: VideoReactionType | null;
}

export async function getVideoReactionSummary(videoId: string): Promise<VideoReactionSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: likesCount }, { count: dislikesCount }, own] = await Promise.all([
    supabase.from("video_reactions").select("*", { count: "exact", head: true }).eq("video_id", videoId).eq("reaction", "like"),
    supabase.from("video_reactions").select("*", { count: "exact", head: true }).eq("video_id", videoId).eq("reaction", "dislike"),
    user
      ? supabase.from("video_reactions").select("reaction").eq("video_id", videoId).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    likesCount: likesCount ?? 0,
    dislikesCount: dislikesCount ?? 0,
    userReaction: own?.data?.reaction ?? null,
  };
}

/** Alterna a reacao do usuario: clicar na mesma reacao ativa a remove. */
export async function setVideoReaction(videoId: string, reaction: VideoReactionType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessao expirada. Faca login novamente.");

  const { data: existing } = await supabase
    .from("video_reactions")
    .select("reaction")
    .eq("video_id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    const { error } = await supabase
      .from("video_reactions")
      .delete()
      .eq("video_id", videoId)
      .eq("user_id", user.id);
    if (error) throw new Error(`Falha ao remover reacao: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("video_reactions")
      .upsert({ video_id: videoId, user_id: user.id, reaction }, { onConflict: "user_id,video_id" });
    if (error) throw new Error(`Falha ao registrar reacao: ${error.message}`);
  }

  revalidatePath(ROUTES.video(videoId));
}

export async function listLikedVideos(): Promise<VideoCardData[]> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("video_reactions")
    .select(`video:videos ( ${VIDEO_CARD_SELECT} )`)
    .eq("user_id", user.id)
    .eq("reaction", "like")
    .order("created_at", { ascending: false })
    .overrideTypes<Array<{ video: VideoCardRow | null }>>();

  if (error) throw new Error(`Falha ao carregar videos curtidos: ${error.message}`);

  return (data ?? [])
    .filter((row): row is typeof row & { video: VideoCardRow } => Boolean(row.video))
    .map((row) =>
      toVideoCardData(
        row.video,
        (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
        (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path)
      )
    );
}
