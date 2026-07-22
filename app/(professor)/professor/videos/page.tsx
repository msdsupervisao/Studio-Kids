import type { Metadata } from "next";
import Link from "next/link";
import { Film } from "lucide-react";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { listVideosByChannel } from "@/features/video/actions/video.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { VideoRowActions } from "@/features/video/components/VideoRowActions";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import type { VideoStatus } from "@/types/video.types";

export const metadata: Metadata = { title: "Meus vídeos" };

const STATUS_LABEL: Record<VideoStatus, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  published: { label: "Publicado", variant: "success" },
  pending: { label: "Em análise", variant: "secondary" },
  draft: { label: "Rascunho", variant: "secondary" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export default async function ProfessorVideosPage() {
  const channels = await getMyChannels();
  const videosByChannel = await Promise.all(channels.map((channel) => listVideosByChannel(channel.id)));
  const videos = videosByChannel.flat().sort((a, b) => (a.publishedAt && b.publishedAt ? b.publishedAt.localeCompare(a.publishedAt) : 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Meus vídeos</h1>
        <Button asChild size="sm">
          <Link href={ROUTES.upload}>Enviar vídeo</Link>
        </Button>
      </div>

      {videos.length === 0 ? (
        <EmptyState
          icon={Film}
          title="Você ainda não enviou nenhum vídeo"
          action={
            <Button asChild>
              <Link href={ROUTES.upload}>Enviar meu primeiro vídeo</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <div key={video.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={STATUS_LABEL[video.status].variant}>{STATUS_LABEL[video.status].label}</Badge>
                <VideoRowActions videoId={video.id} videoTitle={video.title} />
              </div>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
