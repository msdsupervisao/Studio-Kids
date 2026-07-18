"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { sanitizeMultilineText } from "@/utils/sanitize";
import { ROUTES, STORAGE_BUCKETS, UPLOAD_LIMITS } from "@/lib/constants";
import { toVideoCardData, type VideoCardRow } from "@/features/video/lib/video-card.mapper";
import type { ChannelPostKind, ChannelPostStatus } from "@/types/database.types";
import type { VideoCardData } from "@/types/video.types";

const basePostSchema = z.object({
  channelId: z.string().uuid(),
  kind: z.enum(["text", "poll", "quiz", "image", "image_poll", "video"]),
  content: z.string().max(2000),
  videoId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export type ChannelPost = {
  id: string;
  channelId: string;
  authorId: string;
  kind: ChannelPostKind;
  content: string;
  options: string[];
  optionImages: (string | null)[];
  imageUrl: string | null;
  video: VideoCardData | null;
  status: ChannelPostStatus;
  scheduledAt: string | null;
  createdAt: string;
};

const POST_SELECT = `
  id, channel_id, author_id, kind, content, options, option_images, image_path,
  status, scheduled_at, created_at,
  video:videos ( id, slug, title, thumbnail_path, duration_seconds, views_count, published_at,
    channel:channels ( slug, name, avatar_url ) )
`;

type ChannelPostRow = {
  id: string;
  channel_id: string;
  author_id: string;
  kind: ChannelPostKind;
  content: string;
  options: string[];
  option_images: (string | null)[];
  image_path: string | null;
  status: ChannelPostStatus;
  scheduled_at: string | null;
  created_at: string;
  video: VideoCardRow | null;
};

export async function listChannelPosts(channelId: string, options: { forOwner?: boolean } = {}): Promise<ChannelPost[]> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  let query = supabase
    .from("channel_posts")
    .select(POST_SELECT)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!options.forOwner) query = query.eq("status", "published");

  const { data, error } = await query.overrideTypes<ChannelPostRow[], { merge: false }>();
  // Durante uma atualizacao, o deploy pode chegar antes da migration do
  // Supabase. Nesse intervalo, manter o canal acessivel e ocultar a aba de
  // comunidade e melhor do que transformar toda a pagina em erro 500.
  if (error) {
    if (["42P01", "42703", "PGRST205", "PGRST200"].includes(error.code)) return [];
    throw new Error(`Falha ao carregar comunicados: ${error.message}`);
  }

  return (data ?? []).map((post) => ({
    id: post.id,
    channelId: post.channel_id,
    authorId: post.author_id,
    kind: post.kind,
    content: post.content,
    options: post.options,
    optionImages: (post.option_images ?? []).map((path) => storage.getPublicUrl(STORAGE_BUCKETS.postImages, path)),
    imageUrl: storage.getPublicUrl(STORAGE_BUCKETS.postImages, post.image_path),
    video: post.video
      ? toVideoCardData(
          post.video,
          (path) => storage.getPublicUrl(STORAGE_BUCKETS.thumbnails, path),
          (path) => storage.getPublicUrl(STORAGE_BUCKETS.avatars, path)
        )
      : null,
    status: post.status,
    scheduledAt: post.scheduled_at,
    createdAt: post.created_at,
  }));
}

async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Faca login para continuar");
  return auth.user;
}

export async function createChannelPost(formData: FormData) {
  const parsed = basePostSchema.safeParse({
    channelId: formData.get("channelId"),
    kind: formData.get("kind"),
    content: formData.get("content"),
    videoId: formData.get("videoId") || undefined,
    scheduledAt: formData.get("scheduledAt") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Comunicado invalido");
  const { channelId, kind, content, videoId, scheduledAt } = parsed.data;

  const options = formData
    .getAll("option")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .slice(0, 4);

  if (kind === "text" && !content.trim()) throw new Error("Escreva uma mensagem para publicar");
  if ((kind === "poll" || kind === "quiz") && options.length < 2) throw new Error("Adicione ao menos 2 opcoes");
  if (kind === "video" && !videoId) throw new Error("Selecione um video do canal para compartilhar");

  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const user = await requireUser(supabase);

  if (kind === "video" && videoId) {
    const { data: video } = await supabase
      .from("videos")
      .select("id, channel_id, status")
      .eq("id", videoId)
      .single();
    if (!video || video.channel_id !== channelId || video.status !== "published") {
      throw new Error("Video invalido para este canal");
    }
  }

  let imagePath: string | null = null;
  const imageFile = formData.get("image");
  if (kind === "image") {
    if (!(imageFile instanceof File) || imageFile.size === 0) throw new Error("Selecione uma imagem para publicar");
    imagePath = await uploadPostImage(storage, channelId, imageFile);
  }

  const optionImagePaths: (string | null)[] = [];
  if (kind === "image_poll") {
    const files = formData.getAll("optionImage");
    const imageFiles = files.filter((file): file is File => file instanceof File && file.size > 0);
    if (imageFiles.length < 2) throw new Error("Adicione ao menos 2 imagens para a enquete");
    for (const file of imageFiles.slice(0, 4)) {
      optionImagePaths.push(await uploadPostImage(storage, channelId, file));
    }
    while (options.length < optionImagePaths.length) options.push(`Opcao ${options.length + 1}`);
    options.length = optionImagePaths.length;
  }

  const status: ChannelPostStatus = scheduledAt ? "scheduled" : "published";

  const { error } = await supabase.from("channel_posts").insert({
    channel_id: channelId,
    author_id: user.id,
    kind,
    content: sanitizeMultilineText(content),
    options: kind === "text" || kind === "image" || kind === "video" ? [] : options,
    option_images: optionImagePaths,
    image_path: imagePath,
    video_id: kind === "video" ? videoId : null,
    status,
    scheduled_at: scheduledAt ?? null,
  });
  if (error) throw new Error(`Falha ao publicar comunicado: ${error.message}`);
  revalidatePath(ROUTES.myChannel);
}

async function uploadPostImage(storage: ReturnType<typeof createStorageService>, channelId: string, file: File) {
  if (file.size > UPLOAD_LIMITS.maxThumbnailSizeBytes || !(UPLOAD_LIMITS.allowedImageTypes as readonly string[]).includes(file.type)) {
    throw new Error("Imagem deve ser JPEG, PNG ou WebP de ate 5MB");
  }
  const path = `${channelId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split(".").pop() ?? "jpg"}`;
  return storage.upload(STORAGE_BUCKETS.postImages, path, file);
}

export async function voteOnChannelPost(postId: string, optionIndex: number) {
  if (!z.string().uuid().safeParse(postId).success || !Number.isInteger(optionIndex) || optionIndex < 0) {
    throw new Error("Voto invalido");
  }
  const supabase = await createClient();
  const user = await requireUser(supabase);
  const { error } = await supabase.from("channel_post_votes").upsert({
    post_id: postId,
    user_id: user.id,
    option_index: optionIndex,
  });
  if (error) throw new Error(`Falha ao registrar voto: ${error.message}`);
}

export async function setChannelPostStatus(postId: string, status: Extract<ChannelPostStatus, "published" | "archived">) {
  if (!z.string().uuid().safeParse(postId).success) throw new Error("Post invalido");
  const supabase = await createClient();
  await requireUser(supabase);
  const { error } = await supabase
    .from("channel_posts")
    .update({ status, scheduled_at: null })
    .eq("id", postId);
  if (error) throw new Error(`Falha ao atualizar o comunicado: ${error.message}`);
  revalidatePath(ROUTES.myChannel);
}
