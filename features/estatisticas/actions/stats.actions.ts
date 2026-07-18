"use server";

import { createClient } from "@/services/supabase/server";

export interface VideoEngagement {
  likes: number;
  comments: number;
}

export async function getVideoEngagementCounts(videoIds: string[]): Promise<Record<string, VideoEngagement>> {
  const counts: Record<string, VideoEngagement> = {};
  for (const id of videoIds) counts[id] = { likes: 0, comments: 0 };
  if (videoIds.length === 0) return counts;

  const supabase = await createClient();
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from("video_reactions").select("video_id").in("video_id", videoIds).eq("reaction", "like"),
    supabase.from("comments").select("video_id").in("video_id", videoIds),
  ]);

  for (const row of reactions ?? []) {
    const entry = counts[row.video_id];
    if (entry) entry.likes++;
  }
  for (const row of comments ?? []) {
    const entry = counts[row.video_id];
    if (entry) entry.comments++;
  }
  return counts;
}
