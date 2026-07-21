import type { Metadata } from "next";
import { Clock3 } from "lucide-react";
import { listWatchLater } from "@/features/watch-later/actions/watch-later.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Ver mais tarde" };

export default async function WatchLaterPage() {
  const videos = await listWatchLater();

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={Clock3}
        title="Nenhum video salvo para depois"
        description="Videos que voce salvar para assistir mais tarde aparecem aqui."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Ver mais tarde</h1>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
