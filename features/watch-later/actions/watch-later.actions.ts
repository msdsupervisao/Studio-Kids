"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { STORAGE_BUCKETS, ROUTES } from "@/lib/constants";
import { VIDEO_CARD_SELECT, toVideoCardData, type VideoCardRow } from "@/features/video/lib/video-card.mapper";
import type { VideoCardData } from "@/types/video.types";

export async function isInWatchLater(videoId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("watch_later")
    .select("video_id")
    .eq("user_id", user.id)
    .eq("video_id", videoId)
    .maybeSingle();

  return Boolean(data);
}

export async function addToWatchLater(videoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Faca login para salvar videos");

  const { error } = await supabase.from("watch_later").insert({ user_id: user.id, video_id: videoId });
  if (error) throw new Error(`Falha ao salvar video: ${error.message}`);
  revalidatePath(ROUTES.watchLater);
}

export async function removeFromWatchLater(videoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("watch_later").delete().eq("user_id", user.id).eq("video_id", videoId);
  if (error) throw new Error(`Falha ao remover video: ${error.message}`);
  revalidatePath(ROUTES.watchLater);
}

export async function listWatchLater(): Promise<VideoCardData[]> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("watch_later")
    .select(`video:videos ( ${VIDEO_CARD_SELECT} )`)
    .eq("user_id", user.id)
    .order("added_at", { ascending: false })
    .overrideTypes<Array<{ video: VideoCardRow | null }>>();

  if (error) throw new Error(`Falha ao carregar lista: ${error.message}`);

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
