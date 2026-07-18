"use client";

import { useState, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setVideoReaction } from "@/features/reacoes/actions/reaction.actions";
import { formatCompactNumber } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { VideoReactionType } from "@/types/database.types";

export function VideoReactions({
  videoId,
  initialLikes,
  initialReaction,
}: {
  videoId: string;
  initialLikes: number;
  initialReaction: VideoReactionType | null;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [reaction, setReaction] = useState<VideoReactionType | null>(initialReaction);
  const [isPending, startTransition] = useTransition();

  function handleClick(clicked: VideoReactionType) {
    const previous = reaction;
    const next = previous === clicked ? null : clicked;

    setReaction(next);
    if (previous === "like") setLikes((n) => n - 1);
    if (next === "like") setLikes((n) => n + 1);

    startTransition(async () => {
      try {
        await setVideoReaction(videoId, clicked);
      } catch {
        setReaction(previous);
        if (previous === "like") setLikes((n) => n + 1);
        if (next === "like") setLikes((n) => n - 1);
      }
    });
  }

  return (
    <div className="flex overflow-hidden rounded-full border border-border">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => handleClick("like")}
        className={cn("gap-2 rounded-none border-r border-border", reaction === "like" && "bg-secondary")}
        aria-pressed={reaction === "like"}
        aria-label="Gostei"
      >
        <ThumbsUp className={cn("h-4 w-4", reaction === "like" && "fill-current")} />
        {formatCompactNumber(likes)}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => handleClick("dislike")}
        className={cn("rounded-none", reaction === "dislike" && "bg-secondary")}
        aria-pressed={reaction === "dislike"}
        aria-label="Nao gostei"
      >
        <ThumbsDown className={cn("h-4 w-4", reaction === "dislike" && "fill-current")} />
      </Button>
    </div>
  );
}
