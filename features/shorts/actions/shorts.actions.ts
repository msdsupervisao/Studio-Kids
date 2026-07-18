"use server";

import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { VIDEO_CARD_SELECT, toVideoCardData, type VideoCardRow } from "@/features/video/lib/video-card.mapper";
import type { VideoCardData } from "@/types/video.types";
import type { VideoReactionType } from "@/types/database.types";

/** Cards leves (thumbnail) para a prateleira de Shorts na home. */
export async function listShorts(limit = 12): Promise<VideoCardData[]> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data, error } = await supabase
    .from("videos")
    .select(VIDEO_CARD_SELECT)
    .eq("status", "published")
    .eq("is_short", true)
    .order("published_at", { ascending: false })
    .limit(limit)
    .overrideTypes<VideoCardRow[]>();

  if (error) throw new Error(`Falha ao carregar shorts: ${error.message}`);
  return (data ?? []).map((row) =>
    toVideoCardData(
      row,
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
      (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path)
    )
  );
}

export interface ShortFeedItem {
  id: string;
  title: string;
  videoUrl: string;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  userReaction: VideoReactionType | null;
  channel: {
    id: string;
    slug: string;
    name: string;
    avatarUrl: string | null;
    ownerId: string;
  };
  subscribersCount: number;
  isSubscribed: boolean;
}

type ShortRow = {
  id: string;
  title: string;
  video_path: string;
  views_count: number;
  channel: { id: string; owner_id: string; slug: string; name: string; avatar_url: string | null } | null;
};

/** Dados completos (video, canal, reacoes) para o feed vertical de Shorts. */
export async function listShortsFeed(limit = 15): Promise<ShortFeedItem[]> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("videos")
    .select(
      `id, title, video_path, views_count, channel:channels ( id, owner_id, slug, name, avatar_url )`
    )
    .eq("status", "published")
    .eq("is_short", true)
    .order("published_at", { ascending: false })
    .limit(limit)
    .overrideTypes<ShortRow[]>();

  if (error) throw new Error(`Falha ao carregar shorts: ${error.message}`);

  const rows = (data ?? []).filter(
    (row): row is ShortRow & { channel: NonNullable<ShortRow["channel"]> } => Boolean(row.channel)
  );
  if (rows.length === 0) return [];

  const videoIds = rows.map((row) => row.id);
  const channelIds = [...new Set(rows.map((row) => row.channel.id))];

  const [{ data: reactions }, { data: comments }, { data: allSubs }, { data: mySubs }] = await Promise.all([
    supabase.from("video_reactions").select("video_id, reaction, user_id").in("video_id", videoIds),
    supabase.from("comments").select("video_id").in("video_id", videoIds),
    supabase.from("subscriptions").select("channel_id").in("channel_id", channelIds),
    user
      ? supabase.from("subscriptions").select("channel_id").eq("subscriber_id", user.id).in("channel_id", channelIds)
      : Promise.resolve({ data: [] as { channel_id: string }[] }),
  ]);

  const subscriberCountByChannel = new Map<string, number>();
  for (const sub of allSubs ?? []) {
    subscriberCountByChannel.set(sub.channel_id, (subscriberCountByChannel.get(sub.channel_id) ?? 0) + 1);
  }
  const mySubscribedChannelIds = new Set((mySubs ?? []).map((sub) => sub.channel_id));

  const commentsCountByVideo = new Map<string, number>();
  for (const comment of comments ?? []) {
    commentsCountByVideo.set(comment.video_id, (commentsCountByVideo.get(comment.video_id) ?? 0) + 1);
  }

  const likesByVideo = new Map<string, number>();
  const myReactionByVideo = new Map<string, VideoReactionType>();
  for (const reaction of reactions ?? []) {
    if (reaction.reaction === "like") {
      likesByVideo.set(reaction.video_id, (likesByVideo.get(reaction.video_id) ?? 0) + 1);
    }
    if (user && reaction.user_id === user.id) {
      myReactionByVideo.set(reaction.video_id, reaction.reaction);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    videoUrl: storage.getPublicUrl(STORAGE_BUCKETS.videos, row.video_path) ?? "",
    viewsCount: row.views_count,
    likesCount: likesByVideo.get(row.id) ?? 0,
    commentsCount: commentsCountByVideo.get(row.id) ?? 0,
    userReaction: myReactionByVideo.get(row.id) ?? null,
    channel: {
      id: row.channel.id,
      slug: row.channel.slug,
      name: row.channel.name,
      avatarUrl: storage.getPublicUrl(STORAGE_BUCKETS.avatars, row.channel.avatar_url),
      ownerId: row.channel.owner_id,
    },
    subscribersCount: subscriberCountByChannel.get(row.channel.id) ?? 0,
    isSubscribed: mySubscribedChannelIds.has(row.channel.id),
  }));
}

export async function incrementShortView(videoId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_video_views", { video_id_input: videoId });
}
