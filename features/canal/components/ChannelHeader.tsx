import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, Pencil, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SubscribeButton } from "@/features/inscricoes/components/SubscribeButton";
import { formatCompactNumber } from "@/utils/format";
import { ROUTES } from "@/lib/constants";
import type { ChannelWithStats } from "@/types/channel.types";

export function ChannelHeader({
  channel,
  currentUserId,
}: {
  channel: ChannelWithStats;
  currentUserId?: string;
}) {
  const isOwner = currentUserId === channel.owner_id;

  return (
    <div className="space-y-4">
      <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/70 via-primary/40 to-accent/50 sm:h-48">
        {channel.banner_url && (
          <Image src={channel.banner_url} alt="" fill sizes="100vw" className="object-cover" priority />
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="-mt-12 h-20 w-20 border-4 border-background sm:-mt-16 sm:h-24 sm:w-24">
            <AvatarImage src={channel.avatar_url ?? undefined} alt={channel.name} />
            <AvatarFallback className="text-2xl">{channel.name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{channel.name}</h1>
            <p className="text-sm text-muted-foreground">
              @{channel.slug} · {formatCompactNumber(channel.subscribersCount)} inscritos ·{" "}
              {channel.videosCount} vídeos
            </p>
          </div>
        </div>

        {isOwner ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href={ROUTES.editMyChannel}>
                <Pencil className="h-4 w-4" />
                Personalizar canal
              </Link>
            </Button>
            <Button asChild variant="secondary" className="gap-2">
              <Link href={ROUTES.professorVideos}>
                <Video className="h-4 w-4" />
                Gerir vídeos
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Abrir painel do professor">
              <Link href={ROUTES.professor}><LayoutDashboard className="h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <SubscribeButton
            channelId={channel.id}
            channelSlug={channel.slug}
            initialSubscribed={channel.isSubscribed}
            initialCount={channel.subscribersCount}
            isOwnChannel={false}
          />
        )}
      </div>

      {channel.description && <p className="max-w-2xl text-sm text-muted-foreground">{channel.description}</p>}
    </div>
  );
}
