import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Tv } from "lucide-react";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Meu canal" };

export default async function MyChannelPage() {
  const channels = await getMyChannels();
  const [firstChannel] = channels;

  if (channels.length === 1 && firstChannel) {
    redirect(ROUTES.channel(firstChannel.slug));
  }

  if (channels.length === 0) {
    return (
      <EmptyState
        icon={Tv}
        title="Você ainda não tem um canal"
        action={
          <Button asChild>
            <Link href={ROUTES.professorChannels}>Criar canal</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Seus canais</h1>
      <ul className="space-y-2">
        {channels.map((channel) => (
          <li key={channel.id}>
            <Link href={ROUTES.channel(channel.slug)} className="focus-ring text-primary hover:underline">
              {channel.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
