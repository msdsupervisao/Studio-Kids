import type { Metadata } from "next";
import { History } from "lucide-react";
import { listWatchHistory } from "@/features/historico/actions/history.actions";
import { ClearHistoryButton } from "@/features/historico/components/ClearHistoryButton";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Histórico" };

export default async function HistoryPage() {
  const history = await listWatchHistory();

  if (history.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Seu histórico está vazio"
        description="Os vídeos que você assistir aparecem aqui."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Histórico</h1>
        <ClearHistoryButton />
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {history.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
