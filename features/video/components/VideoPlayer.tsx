"use client";

export function VideoPlayer({ src, poster, title }: { src: string; poster: string | null; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        src={src}
        poster={poster ?? undefined}
        controls
        controlsList="nodownload"
        className="h-full w-full"
        aria-label={title}
      />
    </div>
  );
}
