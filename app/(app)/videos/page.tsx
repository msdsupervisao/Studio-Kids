import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { listPublishedVideos } from "@/features/video/actions/video.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Todos os vídeos" };

export default async function AllVideosPage() {
  const videos = await listPublishedVideos({ limit: 60 });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Todos os vídeos</h1>
      {videos.length === 0 ? (
        <EmptyState icon={Compass} title="Ainda não há aulas publicadas" />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
