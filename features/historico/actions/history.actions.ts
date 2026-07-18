"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { STORAGE_BUCKETS, ROUTES } from "@/lib/constants";
import { VIDEO_CARD_SELECT, toVideoCardData, type VideoCardRow } from "@/features/video/lib/video-card.mapper";
import type { VideoCardData } from "@/types/video.types";

export async function upsertVideoProgress(videoId: string, secondsWatched: number, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("video_progress").upsert(
    {
      user_id: user.id,
      video_id: videoId,
      seconds_watched: secondsWatched,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,video_id" }
  );
  if (error) throw new Error(`Falha ao salvar progresso: ${error.message}`);
}

export async function listWatchHistory(): Promise<Array<VideoCardData & { secondsWatched: number; completed: boolean }>> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("video_progress")
    .select(`seconds_watched, completed, video:videos ( ${VIDEO_CARD_SELECT} )`)
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50)
    .overrideTypes<Array<{ seconds_watched: number; completed: boolean; video: VideoCardRow | null }>>();

  if (error) throw new Error(`Falha ao carregar historico: ${error.message}`);

  return (data ?? [])
    .filter((row): row is typeof row & { video: VideoCardRow } => Boolean(row.video))
    .map((row) => ({
      ...toVideoCardData(
        row.video,
        (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
        (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path)
      ),
      secondsWatched: row.seconds_watched,
      completed: row.completed,
    }));
}

export async function clearWatchHistory() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("video_progress").delete().eq("user_id", user.id);
  if (error) throw new Error(`Falha ao limpar historico: ${error.message}`);
  revalidatePath(ROUTES.history);
}
