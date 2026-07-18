"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Archive, BarChart3, CheckCircle2, Clock, ImageIcon, Images, MessageSquare, RotateCcw, Video as VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { setChannelPostStatus, voteOnChannelPost, type ChannelPost } from "@/features/canal/actions/channel-post.actions";
import { formatDuration, formatRelativeDate, formatViews } from "@/utils/format";

const KIND_META: Record<ChannelPost["kind"], { label: string; icon: typeof MessageSquare }> = {
  text: { label: "Comunicado", icon: MessageSquare },
  poll: { label: "Enquete", icon: BarChart3 },
  quiz: { label: "Questionario", icon: CheckCircle2 },
  image: { label: "Imagem", icon: ImageIcon },
  image_poll: { label: "Enquete de imagem", icon: Images },
  video: { label: "Video", icon: VideoIcon },
};

export function ChannelCommunity({ posts, isOwner }: { posts: ChannelPost[]; isOwner: boolean }) {
  if (posts.length === 0) return <p className="py-6 text-sm text-muted-foreground">Nada por aqui ainda.</p>;

  return (
    <div className="max-w-2xl space-y-4">
      {posts.map((post) => (
        <ChannelPostCard key={post.id} post={post} isOwner={isOwner} />
      ))}
    </div>
  );
}

function ChannelPostCard({ post, isOwner }: { post: ChannelPost; isOwner: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const meta = KIND_META[post.kind];

  function vote(index: number) {
    setSelected(index);
    startTransition(async () => {
      try {
        await voteOnChannelPost(post.id, index);
        toast.success(post.kind === "quiz" ? "Resposta registrada" : "Voto registrado");
      } catch (error) {
        setSelected(null);
        toast.error(error instanceof Error ? error.message : "Nao foi possivel registrar seu voto");
      }
    });
  }

  function changeStatus(status: "published" | "archived") {
    startTransition(async () => {
      try {
        await setChannelPostStatus(post.id, status);
        toast.success(status === "archived" ? "Comunicado arquivado" : "Comunicado publicado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Nao foi possivel atualizar o comunicado");
      }
    });
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <meta.icon className="h-4 w-4" />
          <span>{meta.label}</span>
          <span>·</span>
          {post.status === "scheduled" && post.scheduledAt ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" /> Agendado para {formatRelativeDate(post.scheduledAt)}
            </span>
          ) : (
            <span>{formatRelativeDate(post.createdAt)}</span>
          )}
        </div>

        {isOwner && (
          <div className="flex gap-1">
            {post.status === "archived" ? (
              <Button variant="ghost" size="sm" className="gap-1.5" disabled={isPending} onClick={() => changeStatus("published")}>
                <RotateCcw className="h-3.5 w-3.5" /> Restaurar
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="gap-1.5" disabled={isPending} onClick={() => changeStatus("archived")}>
                <Archive className="h-3.5 w-3.5" /> Arquivar
              </Button>
            )}
          </div>
        )}
      </div>

      {post.content && <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>}

      {post.kind === "image" && post.imageUrl && (
        <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <Image src={post.imageUrl} alt="" fill className="object-cover" />
        </div>
      )}

      {(post.kind === "poll" || post.kind === "quiz") && (
        <div className="mt-4 grid gap-2">
          {post.options.map((option, index) => (
            <Button
              key={`${post.id}-${index}`}
              type="button"
              variant={selected === index ? "default" : "outline"}
              className="justify-start text-left"
              disabled={isPending}
              onClick={() => vote(index)}
            >
              {option}
            </Button>
          ))}
        </div>
      )}

      {post.kind === "image_poll" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {post.optionImages.map((imageUrl, index) => (
            <button
              key={`${post.id}-${index}`}
              type="button"
              disabled={isPending}
              onClick={() => vote(index)}
              className={`focus-ring space-y-1.5 rounded-xl border p-1.5 text-left transition-colors ${
                selected === index ? "border-primary" : "border-border hover:bg-secondary/40"
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                {imageUrl && <Image src={imageUrl} alt="" fill className="object-cover" />}
              </div>
              {post.options[index] && <p className="px-1 text-xs">{post.options[index]}</p>}
            </button>
          ))}
        </div>
      )}

      {post.kind === "video" && post.video && (
        <Link
          href={ROUTES.video(post.video.id)}
          className="focus-ring mt-3 flex gap-3 rounded-xl border border-border p-2 hover:bg-secondary/40"
        >
          <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
            {post.video.thumbnailUrl && <Image src={post.video.thumbnailUrl} alt="" fill className="object-cover" />}
            {post.video.durationSeconds > 0 && (
              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
                {formatDuration(post.video.durationSeconds)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-medium">{post.video.title}</p>
            <p className="text-xs text-muted-foreground">{formatViews(post.video.viewsCount)}</p>
          </div>
        </Link>
      )}
    </article>
  );
}
