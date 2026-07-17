import type { Database, VideoStatus } from "./database.types";
import type { Channel } from "./channel.types";

export type Video = Database["public"]["Tables"]["videos"]["Row"];
export type { VideoStatus };

export interface VideoWithChannel extends Video {
  channel: Pick<Channel, "id" | "owner_id" | "name" | "slug" | "avatar_url">;
}

export interface VideoCardData {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  viewsCount: number;
  publishedAt: string | null;
  channel: {
    slug: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface VideoPlaybackData extends VideoWithChannel {
  videoUrl: string;
  thumbnailUrl: string | null;
  isSubscribed: boolean;
  subscribersCount: number;
}
