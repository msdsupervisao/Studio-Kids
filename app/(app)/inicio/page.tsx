import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { listPublishedVideos } from "@/features/video/actions/video.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Inicio" };

export default async function HomePage() {
  const videos = await listPublishedVideos({ limit: 24 });

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="Ainda nao ha aulas publicadas"
        description="Assim que professores publicarem videos, eles aparecerao aqui."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
