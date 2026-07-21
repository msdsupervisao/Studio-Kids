import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/lib/constants";
import { formatDuration, formatRelativeDate, formatViews } from "@/utils/format";
import type { VideoCardData } from "@/types/video.types";

export function VideoCard({ video, editHref }: { video: VideoCardData; editHref?: string }) {
  return (
    <article className="group flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        <Link href={ROUTES.video(video.id)} className="focus-ring absolute inset-0 block">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              sizes="(min-width: 1280px) 23vw, (min-width: 768px) 31vw, 92vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Sem miniatura
            </div>
          )}
          {video.durationSeconds > 0 && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
              {formatDuration(video.durationSeconds)}
            </span>
          )}
        </Link>
        {editHref && (
          <Link
            href={editHref}
            className="focus-ring absolute right-1.5 top-1.5 z-10 flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
          >
            <Pencil className="h-3 w-3" /> Editar
          </Link>
        )}
      </div>

      <div className="flex gap-3">
        <Link href={ROUTES.channel(video.channel.slug)} className="focus-ring shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={video.channel.avatarUrl ?? undefined} alt={video.channel.name} />
            <AvatarFallback>{video.channel.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0">
          <Link href={ROUTES.video(video.id)} className="focus-ring block">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{video.title}</h3>
          </Link>
          <Link
            href={ROUTES.channel(video.channel.slug)}
            className="focus-ring mt-1 block text-xs text-muted-foreground hover:text-foreground"
          >
            {video.channel.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatViews(video.viewsCount)}
            {video.publishedAt && <> · {formatRelativeDate(video.publishedAt)}</>}
          </p>
        </div>
      </div>
    </article>
  );
}
