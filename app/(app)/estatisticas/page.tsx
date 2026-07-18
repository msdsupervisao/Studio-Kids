import type { Metadata } from "next";
import { BarChart3, Eye, Film } from "lucide-react";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { listVideosByChannel } from "@/features/video/actions/video.actions";
import { getVideoEngagementCounts } from "@/features/estatisticas/actions/stats.actions";
import { StatsCards } from "@/features/estatisticas/components/StatsCards";
import { StatsCharts } from "@/features/estatisticas/components/StatsCharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import type { VideoStatus } from "@/types/video.types";

export const metadata: Metadata = { title: "Estatisticas" };

const STATUS_LABEL: Record<VideoStatus, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  published: { label: "Publicado", variant: "success" },
  pending: { label: "Em analise", variant: "secondary" },
  draft: { label: "Rascunho", variant: "secondary" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

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
  const allVideos = videosByChannel.flat();
  const published = allVideos.filter((video) => video.status === "published");
  const totalViews = published.reduce((sum, video) => sum + video.viewsCount, 0);
  const engagement = await getVideoEngagementCounts(allVideos.map((video) => video.id));

  const topVideos = [...published]
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 8)
    .map((video) => ({ label: video.title, value: video.viewsCount }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Estatisticas</h1>
      <StatsCards
        items={[
          { label: "Videos publicados", value: published.length, icon: Film },
          { label: "Visualizacoes totais", value: totalViews, icon: Eye },
        ]}
      />
      {topVideos.length > 0 && <StatsCharts title="Videos mais assistidos" items={topVideos} />}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Todos os videos</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">Titulo</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Visualizacoes</th>
                <th className="px-4 py-2.5 text-right">Likes</th>
                <th className="px-4 py-2.5 text-right">Comentarios</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allVideos.map((video) => (
                <tr key={video.id}>
                  <td className="max-w-xs truncate px-4 py-2.5 font-medium">{video.title}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_LABEL[video.status].variant}>{STATUS_LABEL[video.status].label}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{video.viewsCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{engagement[video.id]?.likes ?? 0}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{engagement[video.id]?.comments ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
