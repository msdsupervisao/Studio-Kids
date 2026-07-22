import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { formatDuration, formatViews } from "@/utils/format";
import type { VideoCardData } from "@/types/video.types";

export function RelatedVideos({ videos }: { videos: VideoCardData[] }) {
  if (videos.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum outro vídeo neste canal ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={ROUTES.video(video.id)}
          className="focus-ring flex gap-3 rounded-lg p-1 transition-colors hover:bg-secondary"
        >
          <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-muted">
            {video.thumbnailUrl && (
              <Image src={video.thumbnailUrl} alt={video.title} fill sizes="144px" className="object-cover" />
            )}
            {video.durationSeconds > 0 && (
              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                {formatDuration(video.durationSeconds)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{video.channel.name}</p>
            <p className="text-xs text-muted-foreground">{formatViews(video.viewsCount)}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
