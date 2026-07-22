import type { Metadata } from "next";
import { listNotifications } from "@/features/notificacoes/actions/notification.actions";
import { NotificationList } from "@/features/notificacoes/components/NotificationList";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const notifications = await listNotifications();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Notificações</h1>
      <NotificationList notifications={notifications} />
    </div>
  );
}
