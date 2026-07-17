import type { Metadata } from "next";
import { Film, ShieldCheck, Tv, Users } from "lucide-react";
import { createClient } from "@/services/supabase/server";
import { StatsCards } from "@/features/estatisticas/components/StatsCards";

export const metadata: Metadata = { title: "Administracao" };

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ count: usersCount }, { count: channelsCount }, { count: videosCount }, { count: pendingCount }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("channels").select("*", { count: "exact", head: true }),
      supabase.from("videos").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("videos").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Visao geral da plataforma</h1>
      <StatsCards
        items={[
          { label: "Usuarios", value: usersCount ?? 0, icon: Users },
          { label: "Canais", value: channelsCount ?? 0, icon: Tv },
          { label: "Videos publicados", value: videosCount ?? 0, icon: Film },
          { label: "Aguardando moderacao", value: pendingCount ?? 0, icon: ShieldCheck },
        ]}
      />
    </div>
  );
}
