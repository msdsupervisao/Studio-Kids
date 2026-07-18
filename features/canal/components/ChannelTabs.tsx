"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/shared/VideoCard";
import { ShortCard } from "@/components/shared/ShortCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Film, Zap } from "lucide-react";
import { formatRelativeDate } from "@/utils/format";
import { ChannelCommunity } from "@/features/canal/components/ChannelCommunity";
import type { ChannelPost } from "@/features/canal/actions/channel-post.actions";
import type { VideoCardData, VideoStatus } from "@/types/video.types";

type ChannelVideo = VideoCardData & { status: VideoStatus; isShort: boolean };

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
  posts,
  isOwner,
}: {
  videos: ChannelVideo[];
  description: string | null;
  createdAt: string;
  showStatus: boolean;
  posts: ChannelPost[];
  isOwner: boolean;
}) {
  const regularVideos = videos.filter((video) => !video.isShort);
  const shorts = videos.filter((video) => video.isShort);
  const publishedVideos = regularVideos.filter((video) => video.status === "published");
  const pendingVideos = regularVideos.filter((video) => video.status === "pending" || video.status === "draft");
  const rejectedVideos = regularVideos.filter((video) => video.status === "rejected");

  return (
    <Tabs defaultValue="videos">
      <TabsList>
        <TabsTrigger value="videos">Videos</TabsTrigger>
        {showStatus && <TabsTrigger value="publicados">Publicados</TabsTrigger>}
        {showStatus && <TabsTrigger value="em-analise">Em analise</TabsTrigger>}
        {showStatus && rejectedVideos.length > 0 && <TabsTrigger value="rejeitados">Rejeitados</TabsTrigger>}
        {(shorts.length > 0 || showStatus) && <TabsTrigger value="shorts">Shorts</TabsTrigger>}
        <TabsTrigger value="comunidade">Comunidade</TabsTrigger>
        <TabsTrigger value="sobre">Sobre</TabsTrigger>
      </TabsList>

      <TabsContent value="videos">
        <VideoGrid videos={regularVideos} showStatus={showStatus} emptyTitle="Nenhum video publicado ainda" />
      </TabsContent>

      {showStatus && (
        <TabsContent value="publicados">
          <VideoGrid videos={publishedVideos} showStatus={false} emptyTitle="Nenhum video publicado ainda" />
        </TabsContent>
      )}
      {showStatus && (
        <TabsContent value="em-analise">
          <VideoGrid videos={pendingVideos} showStatus emptyTitle="Nenhum video aguardando revisao" />
        </TabsContent>
      )}
      {showStatus && rejectedVideos.length > 0 && (
        <TabsContent value="rejeitados">
          <VideoGrid videos={rejectedVideos} showStatus emptyTitle="Nenhum video rejeitado" />
        </TabsContent>
      )}

      <TabsContent value="shorts">
        {shorts.length === 0 ? (
          <EmptyState icon={Zap} title="Nenhum short publicado ainda" />
        ) : (
          <div className="flex flex-wrap gap-4">
            {shorts.map((video) => (
              <div key={video.id} className="space-y-2">
                {showStatus && video.status !== "published" && (
                  <Badge variant={STATUS_LABEL[video.status].variant}>{STATUS_LABEL[video.status].label}</Badge>
                )}
                <ShortCard video={video} />
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="comunidade">
        {isOwner ? <OwnerCommunity posts={posts} /> : <ChannelCommunity posts={posts} isOwner={false} />}
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

function OwnerCommunity({ posts }: { posts: ChannelPost[] }) {
  const published = posts.filter((post) => post.status === "published");
  const scheduled = posts.filter((post) => post.status === "scheduled");
  const archived = posts.filter((post) => post.status === "archived");

  return (
    <Tabs defaultValue="publicadas">
      <TabsList>
        <TabsTrigger value="publicadas">Publicadas</TabsTrigger>
        <TabsTrigger value="agendadas">Agendadas</TabsTrigger>
        <TabsTrigger value="arquivadas">Arquivadas</TabsTrigger>
      </TabsList>
      <TabsContent value="publicadas"><ChannelCommunity posts={published} isOwner /></TabsContent>
      <TabsContent value="agendadas"><ChannelCommunity posts={scheduled} isOwner /></TabsContent>
      <TabsContent value="arquivadas"><ChannelCommunity posts={archived} isOwner /></TabsContent>
    </Tabs>
  );
}

function VideoGrid({
  videos,
  showStatus,
  emptyTitle,
}: {
  videos: ChannelVideo[];
  showStatus: boolean;
  emptyTitle: string;
}) {
  if (videos.length === 0) return <EmptyState icon={Film} title={emptyTitle} />;

  return (
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
  );
}
