import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { listLikedVideos } from "@/features/reacoes/actions/reaction.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Videos curtidos" };

export default async function LikedVideosPage() {
  const videos = await listLikedVideos();

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Nenhum video curtido ainda"
        description="Videos que voce curtir aparecem aqui."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Videos curtidos</h1>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
