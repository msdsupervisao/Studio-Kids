"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { playlistSchema } from "@/lib/validations";
import { sanitizeMultilineText, sanitizePlainText } from "@/utils/sanitize";
import { STORAGE_BUCKETS, PAGE_SIZE, ROUTES } from "@/lib/constants";
import type { PlaylistWithVideos } from "@/types/playlist.types";
import type { VideoCardData } from "@/types/video.types";

export async function listMyPlaylists(): Promise<PlaylistWithVideos[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("playlists")
    .select("*, playlist_videos ( video_id )")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar playlists: ${error.message}`);

  return (data ?? []).map((playlist) => ({
    ...playlist,
    videos: [] as VideoCardData[],
    videosCount: playlist.playlist_videos?.length ?? 0,
  }));
}

export async function listChannelPlaylists(
  ownerId: string,
  includePrivate: boolean
): Promise<PlaylistWithVideos[]> {
  const supabase = await createClient();
  let query = supabase
    .from("playlists")
    .select("*, playlist_videos ( video_id )")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!includePrivate) query = query.eq("is_public", true);

  const { data, error } = await query;
  if (error) throw new Error(`Falha ao carregar playlists: ${error.message}`);

  return (data ?? []).map((playlist) => ({
    ...playlist,
    videos: [] as VideoCardData[],
    videosCount: playlist.playlist_videos?.length ?? 0,
  }));
}

export async function searchPlaylists(query: string): Promise<PlaylistWithVideos[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("playlists")
    .select("*, playlist_videos ( video_id )")
    .ilike("title", `%${query}%`)
    .limit(PAGE_SIZE.search);

  if (error) throw new Error(`Falha na busca de playlists: ${error.message}`);

  return (data ?? []).map((playlist) => ({
    ...playlist,
    videos: [] as VideoCardData[],
    videosCount: playlist.playlist_videos?.length ?? 0,
  }));
}

export interface PlaylistActionState {
  error?: string;
}

export async function createPlaylist(
  _prevState: PlaylistActionState,
  formData: FormData
): Promise<PlaylistActionState> {
  const parsed = playlistSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    isPublic: formData.get("isPublic") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("playlists").insert({
    owner_id: user.id,
    title: sanitizePlainText(parsed.data.title),
    description: parsed.data.description ? sanitizeMultilineText(parsed.data.description) : null,
    is_public: parsed.data.isPublic,
  });

  if (error) return { error: "Não foi possível criar a playlist" };

  revalidatePath(ROUTES.playlists);
  redirect(ROUTES.playlists);
}

export interface PlaylistMembership {
  id: string;
  title: string;
  containsVideo: boolean;
}

export async function listMyPlaylistsForVideo(videoId: string): Promise<PlaylistMembership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("playlists")
    .select("id, title, playlist_videos ( video_id )")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar playlists: ${error.message}`);

  return (data ?? []).map((playlist) => ({
    id: playlist.id,
    title: playlist.title,
    containsVideo: (playlist.playlist_videos ?? []).some((entry) => entry.video_id === videoId),
  }));
}

export async function addVideoToPlaylist(playlistId: string, videoId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("playlist_videos")
    .select("*", { count: "exact", head: true })
    .eq("playlist_id", playlistId);

  const { error } = await supabase
    .from("playlist_videos")
    .insert({ playlist_id: playlistId, video_id: videoId, position: count ?? 0 });
  if (error) throw new Error(`Falha ao adicionar vídeo à playlist: ${error.message}`);
  revalidatePath(ROUTES.playlists);
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("playlist_videos")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("video_id", videoId);
  if (error) throw new Error(`Falha ao remover vídeo da playlist: ${error.message}`);
  revalidatePath(ROUTES.playlists);
}

export async function getPlaylistWithVideos(playlistId: string): Promise<PlaylistWithVideos | null> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data, error } = await supabase
    .from("playlists")
    .select(
      `*, playlist_videos ( position, video:videos ( id, slug, title, thumbnail_path, duration_seconds, views_count, published_at, channel:channels ( slug, name, avatar_url ) ) )`
    )
    .eq("id", playlistId)
    .single();

  if (error || !data) return null;

  const videos = (data.playlist_videos ?? [])
    .sort((a, b) => a.position - b.position)
    .map((entry) => entry.video)
    .filter((video): video is NonNullable<typeof video> => Boolean(video))
    .map((video) => ({
      id: video.id,
      slug: video.slug,
      title: video.title,
      thumbnailUrl: storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, video.thumbnail_path),
      durationSeconds: video.duration_seconds,
      viewsCount: video.views_count,
      publishedAt: video.published_at,
      channel: {
        slug: video.channel?.slug ?? "",
        name: video.channel?.name ?? "Canal removido",
        avatarUrl: video.channel?.avatar_url ?? null,
      },
    }));

  return { ...data, videos, videosCount: videos.length };
}
