import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { formatViews } from "@/utils/format";
import type { VideoCardData } from "@/types/video.types";

export function ShortCard({ video }: { video: VideoCardData }) {
  return (
    <Link href={ROUTES.short(video.id)} className="focus-ring group flex w-32 shrink-0 flex-col gap-1.5 sm:w-36">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-muted">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="144px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Play className="h-6 w-6" />
          </div>
        )}
      </div>
      <p className="line-clamp-2 text-xs font-medium text-foreground">{video.title}</p>
      <p className="text-[11px] text-muted-foreground">{formatViews(video.viewsCount)}</p>
    </Link>
  );
}
