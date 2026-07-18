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
  getAvatarUrl: (path: string | null) => string | null
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
      avatarUrl: getAvatarUrl(row.channel?.avatar_url ?? null),
    },
  };
}
