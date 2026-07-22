import Image from "next/image";
import Link from "next/link";
import { ListVideo } from "lucide-react";
import type { PlaylistWithVideos } from "@/types/playlist.types";

export function PlaylistCard({ playlist }: { playlist: PlaylistWithVideos }) {
  const cover = playlist.videos[0]?.thumbnailUrl;

  return (
    <Link href={`/playlists/${playlist.id}`} className="focus-ring group flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={playlist.title}
            fill
            sizes="(min-width: 768px) 31vw, 92vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ListVideo className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/80 px-2 py-1.5 text-xs font-medium text-white">
          <span className="flex items-center gap-1">
            <ListVideo className="h-3.5 w-3.5" />
            Playlist
          </span>
          <span>{playlist.videosCount} vídeos</span>
        </div>
      </div>
      <div>
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{playlist.title}</h3>
        <p className="text-xs text-muted-foreground">{playlist.is_public ? "Pública" : "Privada"}</p>
      </div>
    </Link>
  );
}
