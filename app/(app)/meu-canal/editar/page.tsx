import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { EditChannelForm } from "@/features/canal/components/EditChannelForm";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Editar canal" };

export default async function EditMyChannelPage({
  searchParams,
}: {
  searchParams: Promise<{ canal?: string }>;
}) {
  const { canal } = await searchParams;
  const channels = await getMyChannels();

  if (channels.length === 0) redirect(ROUTES.professorChannels);

  const channel = canal ? channels.find((c) => c.slug === canal) : channels[0];
  if (!channel) redirect(ROUTES.editMyChannel);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Editar canal</h1>

      {channels.length > 1 && (
        <div className="flex gap-2 text-sm">
          {channels.map((c) => (
            <Link
              key={c.id}
              href={`${ROUTES.editMyChannel}?canal=${c.slug}`}
              className={c.id === channel.id ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <EditChannelForm channel={channel} />
    </div>
  );
}
