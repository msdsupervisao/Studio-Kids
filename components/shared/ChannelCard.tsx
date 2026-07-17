import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/lib/constants";
import { formatCompactNumber } from "@/utils/format";
import type { ChannelWithStats } from "@/types/channel.types";

export function ChannelCard({ channel }: { channel: Pick<ChannelWithStats, "slug" | "name" | "avatar_url" | "subscribersCount"> }) {
  return (
    <Link
      href={ROUTES.channel(channel.slug)}
      className="focus-ring flex flex-col items-center gap-3 rounded-xl p-4 text-center transition-colors hover:bg-secondary"
    >
      <Avatar className="h-20 w-20">
        <AvatarImage src={channel.avatar_url ?? undefined} alt={channel.name} />
        <AvatarFallback className="text-xl">{channel.name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium text-foreground">{channel.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatCompactNumber(channel.subscribersCount)} inscritos
        </p>
      </div>
    </Link>
  );
}
