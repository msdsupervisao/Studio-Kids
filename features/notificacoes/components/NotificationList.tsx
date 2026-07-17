"use client";

import Link from "next/link";
import { Bell, BellOff, MessageSquare, ThumbsUp, UserPlus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/utils/format";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/features/notificacoes/actions/notification.actions";
import type { Notification, NotificationType } from "@/types/notification.types";

const ICON_BY_TYPE: Record<NotificationType, typeof Bell> = {
  video_published: Video,
  new_subscriber: UserPlus,
  new_comment: MessageSquare,
  comment_reply: MessageSquare,
  video_approved: ThumbsUp,
  video_rejected: Video,
};

const MESSAGE_BY_TYPE: Record<NotificationType, (payload: Record<string, unknown>) => string> = {
  video_published: (p) => `O video "${p.title ?? ""}" foi publicado.`,
  new_subscriber: (p) => `${p.name ?? "Alguem"} se inscreveu no seu canal.`,
  new_comment: (p) => `${p.name ?? "Alguem"} comentou no seu video.`,
  comment_reply: (p) => `${p.name ?? "Alguem"} respondeu seu comentario.`,
  video_approved: (p) => `Seu video "${p.title ?? ""}" foi aprovado.`,
  video_rejected: (p) => `Seu video "${p.title ?? ""}" foi rejeitado.`,
};

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
        {notifications.map((notification) => {
          const Icon = ICON_BY_TYPE[notification.type] ?? Bell;
          const message = MESSAGE_BY_TYPE[notification.type]?.(notification.payload) ?? "Nova notificacao";
          const href = typeof notification.payload.href === "string" ? notification.payload.href : undefined;

          const content = (
            <div
              className={cn(
                "flex items-start gap-3 p-4 transition-colors",
                !notification.read_at && "bg-primary/5"
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{message}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeDate(notification.created_at)}</p>
              </div>
              {!notification.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </div>
          );

          return (
            <li key={notification.id} onClick={() => !notification.read_at && markNotificationAsRead(notification.id)}>
              {href ? (
                <Link href={href} className="focus-ring block hover:bg-secondary">
                  {content}
                </Link>
              ) : (
                <div className="cursor-default">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
