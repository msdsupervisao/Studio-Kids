"use client";

import { useActionState, useRef } from "react";
import { createComment, type CommentActionState } from "@/features/comentarios/actions/comment.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: CommentActionState = {};

export function CommentForm({
  videoId,
  parentId = null,
  onSuccess,
  placeholder = "Adicione um comentario...",
}: {
  videoId: string;
  parentId?: string | null;
  onSuccess?: () => void;
  placeholder?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = createComment.bind(null, videoId, parentId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
        onSuccess?.();
      }}
      className="space-y-2"
    >
      <Textarea name="content" placeholder={placeholder} required minLength={1} maxLength={2000} className="min-h-16" />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Enviando..." : "Comentar"}
        </Button>
      </div>
    </form>
  );
}
