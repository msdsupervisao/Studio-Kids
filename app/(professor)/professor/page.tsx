import type { Metadata } from "next";
import { Eye, Film, Tv, Users } from "lucide-react";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { listVideosByChannel } from "@/features/video/actions/video.actions";
import { StatsCards } from "@/features/estatisticas/components/StatsCards";
import { createClient } from "@/services/supabase/server";

export const metadata: Metadata = { title: "Área do professor" };

export default async function ProfessorOverviewPage() {
  const supabase = await createClient();
  const channels = await getMyChannels();
  const videosByChannel = await Promise.all(channels.map((channel) => listVideosByChannel(channel.id)));
  const videos = videosByChannel.flat();

  const totalViews = videos.reduce((sum, video) => sum + video.viewsCount, 0);
  const publishedCount = videos.filter((video) => video.status === "published").length;

  let totalSubscribers = 0;
  if (channels.length > 0) {
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("channel_id", channels.map((channel) => channel.id));
    totalSubscribers = count ?? 0;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Visão geral</h1>
      <StatsCards
        items={[
          { label: "Canais", value: channels.length, icon: Tv },
          { label: "Vídeos publicados", value: publishedCount, icon: Film },
          { label: "Inscritos", value: totalSubscribers, icon: Users },
          { label: "Visualizações", value: totalViews, icon: Eye },
        ]}
      />
    </div>
  );
}
