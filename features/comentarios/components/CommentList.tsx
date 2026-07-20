"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentForm } from "@/features/comentarios/components/CommentForm";
import { deleteComment } from "@/features/comentarios/actions/comment.actions";
import { formatRelativeDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types/comment.types";

type SortMode = "relevantes" | "recentes";

const SORT_LABEL: Record<SortMode, string> = {
  relevantes: "Mais relevantes",
  recentes: "Mais recentes",
};

// "Relevancia" e aproximada pelo volume de respostas, ja que os
// comentarios nao tem contagem de curtidas. E uma heuristica simples,
// nao um algoritmo de ranking real.
function sortComments(comments: CommentWithAuthor[], mode: SortMode): CommentWithAuthor[] {
  if (mode === "recentes") {
    return [...comments].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return [...comments].sort((a, b) => {
    const diff = (b.replies?.length ?? 0) - (a.replies?.length ?? 0);
    return diff !== 0 ? diff : b.created_at.localeCompare(a.created_at);
  });
}

export function CommentList({
  videoId,
  comments,
  currentUserId,
}: {
  videoId: string;
  comments: CommentWithAuthor[];
  currentUserId?: string;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("relevantes");
  const sorted = useMemo(() => sortComments(comments, sortMode), [comments, sortMode]);

  if (comments.length === 0) return null;

  return (
    <div className="space-y-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="focus-ring flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
          >
            Ordenar por: {SORT_LABEL[sortMode]}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
            <DropdownMenuItem
              key={mode}
              onSelect={() => setSortMode(mode)}
              className={cn(mode === sortMode && "font-semibold text-primary")}
            >
              {SORT_LABEL[mode]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {sorted.map((comment) => (
        <CommentItem key={comment.id} videoId={videoId} comment={comment} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

function CommentItem({
  videoId,
  comment,
  currentUserId,
}: {
  videoId: string;
  comment: CommentWithAuthor;
  currentUserId?: string;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="flex gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={comment.author.avatar_url ?? undefined} alt={comment.author.full_name} />
        <AvatarFallback>{comment.author.full_name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{comment.author.full_name}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeDate(comment.created_at)}</p>
        </div>
        <p className="whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReplying((current) => !current)}
            className="focus-ring text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Responder
          </button>
          {currentUserId === comment.author_id && (
            <button
              type="button"
              onClick={() => deleteComment(comment.id, videoId)}
              className="focus-ring flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" /> Excluir
            </button>
          )}
        </div>

        {replying && (
          <div className="pt-2">
            <CommentForm
              videoId={videoId}
              parentId={comment.id}
              placeholder={`Respondendo a ${comment.author.full_name}...`}
              onSuccess={() => setReplying(false)}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="ml-1 space-y-4 border-l border-border pl-4 pt-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} videoId={videoId} comment={reply} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
