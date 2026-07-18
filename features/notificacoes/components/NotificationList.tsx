"use client";

import { BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsAsRead } from "@/features/notificacoes/actions/notification.actions";
import { NotificationRow } from "@/features/notificacoes/components/NotificationRow";
import type { Notification } from "@/types/notification.types";

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <BellOff className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Nenhuma notificacao ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => markAllNotificationsAsRead()}>
          Marcar tudo como lido
        </Button>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <NotificationRow notification={notification} />
          </li>
        ))}
      </ul>
    </div>
  );
}
