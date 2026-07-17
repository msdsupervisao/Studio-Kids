import type { Metadata } from "next";
import { BarChart3, Eye, Film } from "lucide-react";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { listVideosByChannel } from "@/features/video/actions/video.actions";
import { StatsCards } from "@/features/estatisticas/components/StatsCards";
import { StatsCharts } from "@/features/estatisticas/components/StatsCharts";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Estatisticas" };

export default async function StatsPage() {
  const channels = await getMyChannels();

  if (channels.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sem estatisticas ainda"
        description="Crie um canal e publique videos para acompanhar o desempenho aqui."
      />
    );
  }

  const videosByChannel = await Promise.all(channels.map((channel) => listVideosByChannel(channel.id)));
  const videos = videosByChannel.flat().filter((video) => video.status === "published");
  const totalViews = videos.reduce((sum, video) => sum + video.viewsCount, 0);

  const topVideos = [...videos]
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 8)
    .map((video) => ({ label: video.title, value: video.viewsCount }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Estatisticas</h1>
      <StatsCards
        items={[
          { label: "Videos publicados", value: videos.length, icon: Film },
          { label: "Visualizacoes totais", value: totalViews, icon: Eye },
        ]}
      />
      <StatsCharts title="Videos mais assistidos" items={topVideos} />
    </div>
  );
}
