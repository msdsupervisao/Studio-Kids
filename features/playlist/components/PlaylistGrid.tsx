import { ListVideo } from "lucide-react";
import { PlaylistCard } from "@/components/shared/PlaylistCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { PlaylistWithVideos } from "@/types/playlist.types";

export function PlaylistGrid({
  playlists,
  emptyTitle = "Voce ainda nao criou nenhuma playlist",
}: {
  playlists: PlaylistWithVideos[];
  emptyTitle?: string;
}) {
  if (playlists.length === 0) {
    return <EmptyState icon={ListVideo} title={emptyTitle} />;
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} />
      ))}
    </div>
  );
}
