"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Film } from "lucide-react";
import { formatRelativeDate } from "@/utils/format";
import type { VideoCardData, VideoStatus } from "@/types/video.types";

type ChannelVideo = VideoCardData & { status: VideoStatus };

const STATUS_LABEL: Record<VideoStatus, { label: string; variant: "success" | "secondary" | "destructive" }> = {
  published: { label: "Publicado", variant: "success" },
  pending: { label: "Em analise", variant: "secondary" },
  draft: { label: "Rascunho", variant: "secondary" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export function ChannelTabs({
  videos,
  description,
  createdAt,
  showStatus,
}: {
  videos: ChannelVideo[];
  description: string | null;
  createdAt: string;
  showStatus: boolean;
}) {
  return (
    <Tabs defaultValue="videos">
      <TabsList>
        <TabsTrigger value="videos">Videos</TabsTrigger>
        <TabsTrigger value="sobre">Sobre</TabsTrigger>
      </TabsList>

      <TabsContent value="videos">
        {videos.length === 0 ? (
          <EmptyState icon={Film} title="Nenhum video publicado ainda" />
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <div key={video.id} className="space-y-2">
                {showStatus && video.status !== "published" && (
                  <Badge variant={STATUS_LABEL[video.status].variant}>{STATUS_LABEL[video.status].label}</Badge>
                )}
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="sobre">
        <div className="max-w-2xl space-y-2 text-sm">
          <p className="text-foreground">{description || "Este canal ainda nao tem uma descricao."}</p>
          <p className="text-muted-foreground">No Studio Kids desde {formatRelativeDate(createdAt)}</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
