import type { Metadata } from "next";
import { Tv } from "lucide-react";
import { listMySubscriptions } from "@/features/canal/actions/channel.actions";
import { ChannelCard } from "@/components/shared/ChannelCard";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Inscricoes" };

export default async function SubscriptionsPage() {
  const channels = await listMySubscriptions();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Inscricoes</h1>
      {channels.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="Voce ainda nao se inscreveu em nenhum canal"
          description="Inscreva-se em canais de professores para acompanhar as novas aulas aqui."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {channels.map((channel) => (
            <ChannelCard key={channel.slug} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
}
