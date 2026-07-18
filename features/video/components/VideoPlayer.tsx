"use client";

import { useRef } from "react";
import { upsertVideoProgress } from "@/features/historico/actions/history.actions";
import { useUser } from "@/hooks/use-user";

// Salva o progresso no maximo a cada 5s de reproducao (nao a cada evento
// timeupdate, que dispara varias vezes por segundo) para nao sobrecarregar
// o banco.
const SAVE_INTERVAL_SECONDS = 5;

export function VideoPlayer({
  videoId,
  src,
  poster,
  title,
  durationSeconds,
}: {
  videoId: string;
  src: string;
  poster: string | null;
  title: string;
  durationSeconds: number;
}) {
  const { user } = useUser();
  const lastSavedRef = useRef(0);

  function saveProgress(currentTime: number) {
    if (!user) return;
    const seconds = Math.round(currentTime);
    if (Math.abs(seconds - lastSavedRef.current) < SAVE_INTERVAL_SECONDS) return;
    lastSavedRef.current = seconds;
    const completed = durationSeconds > 0 && seconds >= durationSeconds - 3;
    upsertVideoProgress(videoId, seconds, completed).catch(() => {});
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        src={src}
        poster={poster ?? undefined}
        controls
        controlsList="nodownload"
        className="h-full w-full"
        aria-label={title}
        onTimeUpdate={(event) => saveProgress(event.currentTarget.currentTime)}
        onPause={(event) => saveProgress(event.currentTarget.currentTime)}
      />
    </div>
  );
}
