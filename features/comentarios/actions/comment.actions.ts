"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { commentSchema } from "@/lib/validations";
import { sanitizeMultilineText } from "@/utils/sanitize";
import { ROUTES } from "@/lib/constants";
import type { CommentWithAuthor } from "@/types/comment.types";

export async function listComments(videoId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles ( id, username, full_name, avatar_url )")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar comentários: ${error.message}`);

  const rows = (data ?? []).filter((row) => row.author) as CommentWithAuthor[];
  const topLevel = rows.filter((row) => !row.parent_id);
  const replies = rows.filter((row) => row.parent_id);

  return topLevel.map((comment) => ({
    ...comment,
    replies: replies.filter((reply) => reply.parent_id === comment.id),
  }));
}

export interface CommentActionState {
  error?: string;
}

export async function createComment(
  videoId: string,
  parentId: string | null,
  _prevState: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  const parsed = commentSchema.safeParse({
    videoId,
    parentId: parentId ?? undefined,
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Comentário inválido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Faça login para comentar" };

  const { error } = await supabase.from("comments").insert({
    video_id: parsed.data.videoId,
    parent_id: parsed.data.parentId ?? null,
    author_id: user.id,
    content: sanitizeMultilineText(parsed.data.content),
  });

  if (error) return { error: "Não foi possível publicar o comentário" };

  revalidatePath(ROUTES.video(videoId));
  return {};
}

export async function deleteComment(commentId: string, videoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw new Error(`Falha ao remover comentário: ${error.message}`);
  revalidatePath(ROUTES.video(videoId));
}
