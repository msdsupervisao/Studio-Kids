import type { Metadata } from "next";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { CreateChannelForm } from "@/features/canal/components/CreateChannelForm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Meus canais" };

export default async function ProfessorChannelsPage() {
  const channels = await getMyChannels();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <h1 className="text-xl font-semibold tracking-tight">Seus canais</h1>
        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Voce ainda nao tem nenhum canal.</p>
        ) : (
          <ul className="space-y-2">
            {channels.map((channel) => (
              <li key={channel.id}>
                <Link
                  href={ROUTES.channel(channel.slug)}
                  className="focus-ring flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-secondary"
                >
                  <Avatar>
                    <AvatarFallback>{channel.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">/canal/{channel.slug}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold">Criar novo canal</h2>
        <CreateChannelForm />
      </div>
    </div>
  );
}
