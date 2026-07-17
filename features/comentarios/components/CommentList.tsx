"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "@/features/comentarios/components/CommentForm";
import { deleteComment } from "@/features/comentarios/actions/comment.actions";
import { formatRelativeDate } from "@/utils/format";
import type { CommentWithAuthor } from "@/types/comment.types";

export function CommentList({
  videoId,
  comments,
  currentUserId,
}: {
  videoId: string;
  comments: CommentWithAuthor[];
  currentUserId?: string;
}) {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
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
