"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { createStorageService } from "@/services/storage/storage.service";
import { channelSchema } from "@/lib/validations";
import { STORAGE_BUCKETS, PAGE_SIZE, ROUTES, UPLOAD_LIMITS } from "@/lib/constants";
import { sanitizeMultilineText, sanitizePlainText } from "@/utils/sanitize";
import type { ChannelWithStats } from "@/types/channel.types";

export async function getChannelBySlug(slug: string): Promise<ChannelWithStats | null> {
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("channels")
    .select("*, owner:profiles!channels_owner_id_fkey ( id, username, full_name, avatar_url )")
    .eq("slug", slug)
    .single();

  if (error || !data || !data.owner) return null;

  const [{ count: subscribersCount }, { count: videosCount }, subscription] = await Promise.all([
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("channel_id", data.id),
    supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("channel_id", data.id)
      .eq("status", "published"),
    user
      ? supabase
          .from("subscriptions")
          .select("channel_id")
          .eq("channel_id", data.id)
          .eq("subscriber_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    ...data,
    owner: data.owner,
    avatar_url: storage.getPublicUrl(STORAGE_BUCKETS.avatars, data.avatar_url),
    banner_url: storage.getPublicUrl(STORAGE_BUCKETS.banners, data.banner_url),
    subscribersCount: subscribersCount ?? 0,
    videosCount: videosCount ?? 0,
    isSubscribed: Boolean(subscription?.data),
  };
}

export async function searchChannels(query: string) {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const { data, error } = await supabase
    .from("channels")
    .select("id, slug, name, avatar_url")
    .ilike("name", `%${query}%`)
    .limit(PAGE_SIZE.search);

  if (error) throw new Error(`Falha na busca de canais: ${error.message}`);

  return Promise.all(
    (data ?? []).map(async (channel) => {
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", channel.id);

      return {
        slug: channel.slug,
        name: channel.name,
        avatar_url: storage.getPublicUrl(STORAGE_BUCKETS.avatars, channel.avatar_url),
        subscribersCount: count ?? 0,
      };
    })
  );
}

export async function listMySubscriptions() {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("subscriptions")
    .select("channel:channels ( id, slug, name, avatar_url )")
    .eq("subscriber_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar inscricoes: ${error.message}`);

  const channels = (data ?? [])
    .map((row) => row.channel)
    .filter((channel): channel is NonNullable<typeof channel> => Boolean(channel));

  return Promise.all(
    channels.map(async (channel) => {
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("channel_id", channel.id);

      return {
        slug: channel.slug,
        name: channel.name,
        avatar_url: storage.getPublicUrl(STORAGE_BUCKETS.avatars, channel.avatar_url),
        subscribersCount: count ?? 0,
      };
    })
  );
}

// Versao leve para a sidebar (renderizada em toda pagina do app) — sem a
// contagem de inscritos por canal, que exigiria uma query extra por canal.
export async function listMySubscribedChannelsForSidebar() {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("subscriptions")
    .select("channel:channels ( slug, name, avatar_url )")
    .eq("subscriber_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar inscricoes: ${error.message}`);

  return (data ?? [])
    .map((row) => row.channel)
    .filter((channel): channel is NonNullable<typeof channel> => Boolean(channel))
    .map((channel) => ({
      slug: channel.slug,
      name: channel.name,
      avatarUrl: storage.getPublicUrl(STORAGE_BUCKETS.avatars, channel.avatar_url),
    }));
}

export async function getMyChannels() {
  const supabase = await createClient();
  const storage = createStorageService(supabase);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao carregar seus canais: ${error.message}`);
  return (data ?? []).map((channel) => ({
    ...channel,
    avatar_url: storage.getPublicUrl(STORAGE_BUCKETS.avatars, channel.avatar_url),
    banner_url: storage.getPublicUrl(STORAGE_BUCKETS.banners, channel.banner_url),
  }));
}

export interface ChannelActionState {
  error?: string;
  success?: boolean;
}

export async function createChannel(
  _prevState: ChannelActionState,
  formData: FormData
): Promise<ChannelActionState> {
  const parsed = channelSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessao expirada. Faca login novamente." };

  const { error } = await supabase.from("channels").insert({
    owner_id: user.id,
    name: sanitizePlainText(parsed.data.name),
    slug: parsed.data.slug,
    description: parsed.data.description ? sanitizeMultilineText(parsed.data.description) : null,
  });

  if (error) {
    if (error.code === "23505") return { error: "Ja existe um canal com esse endereco" };
    return { error: "Nao foi possivel criar o canal" };
  }

  revalidatePath(ROUTES.professorChannels);
  return { success: true };
}

export async function updateChannel(
  channelId: string,
  _prevState: ChannelActionState,
  formData: FormData
): Promise<ChannelActionState> {
  const parsed = channelSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const supabase = await createClient();
  const storage = createStorageService(supabase);

  const avatarFile = formData.get("avatarFile");
  const bannerFile = formData.get("bannerFile");
  let avatarPath: string | undefined;
  let bannerPath: string | undefined;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (
      avatarFile.size > UPLOAD_LIMITS.maxThumbnailSizeBytes ||
      !(UPLOAD_LIMITS.allowedImageTypes as readonly string[]).includes(avatarFile.type)
    ) {
      return { error: "Avatar deve ser uma imagem JPEG, PNG ou WebP de ate 5MB" };
    }
    avatarPath = `${channelId}/avatar-${Date.now()}.${avatarFile.name.split(".").pop() ?? "jpg"}`;
    await storage.upload(STORAGE_BUCKETS.avatars, avatarPath, avatarFile);
  }
  if (bannerFile instanceof File && bannerFile.size > 0) {
    if (
      bannerFile.size > UPLOAD_LIMITS.maxThumbnailSizeBytes ||
      !(UPLOAD_LIMITS.allowedImageTypes as readonly string[]).includes(bannerFile.type)
    ) {
      return { error: "Capa deve ser uma imagem JPEG, PNG ou WebP de ate 5MB" };
    }
    bannerPath = `${channelId}/banner-${Date.now()}.${bannerFile.name.split(".").pop() ?? "jpg"}`;
    await storage.upload(STORAGE_BUCKETS.banners, bannerPath, bannerFile);
  }

  const { error } = await supabase
    .from("channels")
    .update({
      name: sanitizePlainText(parsed.data.name),
      slug: parsed.data.slug,
      description: parsed.data.description ? sanitizeMultilineText(parsed.data.description) : null,
      ...(avatarPath ? { avatar_url: avatarPath } : {}),
      ...(bannerPath ? { banner_url: bannerPath } : {}),
    })
    .eq("id", channelId);

  if (error) {
    if (error.code === "23505") return { error: "Ja existe um canal com esse endereco" };
    return { error: "Nao foi possivel salvar as alteracoes" };
  }

  revalidatePath(ROUTES.channel(parsed.data.slug));
  revalidatePath(ROUTES.myChannel);
  return { success: true };
}
