"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Play, Share2, ThumbsDown, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { setVideoReaction } from "@/features/reacoes/actions/reaction.actions";
import { toggleSubscription } from "@/features/inscricoes/actions/subscription.actions";
import { incrementShortView, type ShortFeedItem } from "@/features/shorts/actions/shorts.actions";
import { useUser } from "@/hooks/use-user";
import { ROUTES } from "@/lib/constants";
import { formatCompactNumber } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { VideoReactionType } from "@/types/database.types";

export function ShortPlayer({ item }: { item: ShortFeedItem }) {
  const { user } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCountedView = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [likes, setLikes] = useState(item.likesCount);
  const [reaction, setReaction] = useState<VideoReactionType | null>(item.userReaction);
  const [subscribed, setSubscribed] = useState(item.isSubscribed);
  const [subscribersCount, setSubscribersCount] = useState(item.subscribersCount);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsActive(entry.isIntersecting && entry.intersectionRatio >= 0.6);
      },
      { threshold: [0, 0.6, 1] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(() => {});
      setIsPlaying(true);
      if (!hasCountedView.current) {
        hasCountedView.current = true;
        incrementShortView(item.id).catch(() => {});
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive, item.id]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function toggleReaction(clicked: VideoReactionType) {
    if (!user) {
      toast.error("Entre para curtir videos");
      return;
    }
    const previous = reaction;
    const next = previous === clicked ? null : clicked;
    setReaction(next);
    if (previous === "like") setLikes((n) => n - 1);
    if (next === "like") setLikes((n) => n + 1);

    setVideoReaction(item.id, clicked).catch(() => {
      setReaction(previous);
      if (previous === "like") setLikes((n) => n + 1);
      if (next === "like") setLikes((n) => n - 1);
    });
  }

  function toggleSub() {
    if (!user) {
      toast.error("Entre para se inscrever");
      return;
    }
    const optimistic = !subscribed;
    setSubscribed(optimistic);
    setSubscribersCount((n) => n + (optimistic ? 1 : -1));
    toggleSubscription(item.channel.id, item.channel.slug).catch(() => {
      setSubscribed(!optimistic);
      setSubscribersCount((n) => n + (optimistic ? -1 : 1));
    });
  }

  async function handleShare() {
    const url = `${window.location.origin}${ROUTES.short(item.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Nao foi possivel copiar o link");
    }
  }

  const isOwnChannel = user?.id === item.channel.ownerId;

  return (
    <div ref={containerRef} className="flex h-full w-full snap-start items-center justify-center py-3">
      <div className="relative aspect-[9/16] h-full max-h-full overflow-hidden rounded-2xl bg-black shadow-lg">
        <video
          ref={videoRef}
          src={item.videoUrl}
          className="h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          onClick={togglePlay}
        />

        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlay}
            className="focus-ring absolute inset-0 flex items-center justify-center bg-black/20"
            aria-label="Reproduzir"
          >
            <Play className="h-14 w-14 text-white/90" fill="currentColor" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsMuted((muted) => !muted)}
          className="focus-ring absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white"
          aria-label={isMuted ? "Ativar som" : "Silenciar"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4">
          <div className="min-w-0 flex-1 text-white">
            <Link href={ROUTES.channel(item.channel.slug)} className="focus-ring flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-white/40">
                <AvatarImage src={item.channel.avatarUrl ?? undefined} alt={item.channel.name} />
                <AvatarFallback>{item.channel.name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{item.channel.name}</span>
            </Link>
            {!isOwnChannel && (
              <button
                type="button"
                onClick={toggleSub}
                className={cn(
                  "focus-ring mt-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  subscribed ? "bg-white/20 text-white" : "bg-white text-black"
                )}
              >
                {subscribed ? "Inscrito" : "Inscrever-se"} ({formatCompactNumber(subscribersCount)})
              </button>
            )}
            <p className="mt-2 line-clamp-2 text-sm">{item.title}</p>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-4 pb-1 text-white">
            <button
              type="button"
              onClick={() => toggleReaction("like")}
              className="focus-ring flex flex-col items-center gap-1"
              aria-pressed={reaction === "like"}
              aria-label="Gostei"
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full bg-black/40",
                  reaction === "like" && "bg-white/25"
                )}
              >
                <Heart className={cn("h-5 w-5", reaction === "like" && "fill-current text-red-500")} />
              </span>
              <span className="text-xs font-medium">{formatCompactNumber(likes)}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleReaction("dislike")}
              className="focus-ring flex flex-col items-center gap-1"
              aria-pressed={reaction === "dislike"}
              aria-label="Nao gostei"
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full bg-black/40",
                  reaction === "dislike" && "bg-white/25"
                )}
              >
                <ThumbsDown className={cn("h-5 w-5", reaction === "dislike" && "fill-current")} />
              </span>
            </button>

            <Link href={`${ROUTES.video(item.id)}#comentarios`} className="focus-ring flex flex-col items-center gap-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium">{formatCompactNumber(item.commentsCount)}</span>
            </Link>

            <button type="button" onClick={handleShare} className="focus-ring flex flex-col items-center gap-1" aria-label="Compartilhar">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40">
                <Share2 className="h-5 w-5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
