"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { createServiceRoleClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";
import type { Notification, NotificationType } from "@/types/notification.types";

export async function listNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Falha ao carregar notificações: ${error.message}`);
  return (data ?? []) as Notification[];
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw new Error(`Falha ao marcar notificação: ${error.message}`);
  revalidatePath(ROUTES.notifications);
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) throw new Error(`Falha ao marcar notificações: ${error.message}`);
  revalidatePath(ROUTES.notifications);
}

/**
 * Usa o cliente service-role porque quem recebe a notificacao nao e o
 * usuario autenticado na request atual (ex: professor sendo avisado de
 * um novo inscrito). Chamado internamente por outras actions, nunca
 * exposto direto a um form do cliente.
 */
export async function notifyUser(userId: string, type: NotificationType, payload: Record<string, unknown>) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("notifications").insert({ user_id: userId, type, payload });
  if (error) throw new Error(`Falha ao criar notificação: ${error.message}`);
}
