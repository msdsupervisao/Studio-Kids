"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";

export async function toggleSubscription(channelId: string, channelSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Faca login para se inscrever");

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("channel_id")
    .eq("channel_id", channelId)
    .eq("subscriber_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("channel_id", channelId)
      .eq("subscriber_id", user.id);
    if (error) throw new Error(`Falha ao cancelar inscricao: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("subscriptions")
      .insert({ channel_id: channelId, subscriber_id: user.id });
    if (error) throw new Error(`Falha ao se inscrever: ${error.message}`);
  }

  revalidatePath(`/canal/${channelSlug}`);
  return { subscribed: !existing };
}
