"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/services/supabase/client";
import { listNotifications } from "@/features/notificacoes/actions/notification.actions";
import type { Notification } from "@/types/notification.types";

/** Lista notificacoes e mantem a contagem de nao-lidas em tempo real via Realtime. */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listNotifications()
      .then((data) => {
        if (active) setNotifications(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const supabase = createClient();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((current) => [payload.new as Notification, ...current]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return { notifications, unreadCount, loading };
}
