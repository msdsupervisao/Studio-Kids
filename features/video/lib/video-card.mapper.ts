import type { createClient } from "@/services/supabase/server";
import type { VideoCardData } from "@/types/video.types";

export const VIDEO_CARD_SELECT = `
  id, slug, title, thumbnail_path, duration_seconds, views_count, published_at,
  channel:channels ( slug, name, avatar_url )
`;

export type VideoCardRow = {
  id: string;
  slug: string;
  title: string;
  thumbnail_path: string | null;
  duration_seconds: number;
  views_count: number;
  published_at: string | null;
  channel: { slug: string; name: string; avatar_url: string | null } | null;
};

export function toVideoCardData(
  row: VideoCardRow,
  getThumbnailUrl: (path: string | null) => string | null,
  getAvatarUrl: (path: string | null) => string | null,
  likesCount = 0
): VideoCardData {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    thumbnailUrl: getThumbnailUrl(row.thumbnail_path),
    durationSeconds: row.duration_seconds,
    viewsCount: row.views_count,
    likesCount,
    publishedAt: row.published_at,
    channel: {
      slug: row.channel?.slug ?? "",
      name: row.channel?.name ?? "Canal removido",
      avatarUrl: getAvatarUrl(row.channel?.avatar_url ?? null),
    },
  };
}

/**
 * Curtidas nao ficam em coluna denormalizada (ver 0002_video_reactions.sql)
 * — uma unica query agrupada por lote de videos, em vez de uma contagem por
 * card (o mesmo padrao ja usado em listShortsFeed).
 */
export async function getLikesCountMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  videoIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (videoIds.length === 0) return map;

  const { data, error } = await supabase
    .from("video_reactions")
    .select("video_id")
    .eq("reaction", "like")
    .in("video_id", videoIds);

  if (error) throw new Error(`Falha ao carregar curtidas: ${error.message}`);

  for (const row of data ?? []) {
    map.set(row.video_id, (map.get(row.video_id) ?? 0) + 1);
  }
  return map;
}
