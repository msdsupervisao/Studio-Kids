import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { searchVideos } from "@/features/video/actions/video.actions";
import { searchChannels } from "@/features/canal/actions/channel.actions";
import { searchPlaylists } from "@/features/playlist/actions/playlist.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { ChannelCard } from "@/components/shared/ChannelCard";
import { PlaylistCard } from "@/components/shared/PlaylistCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pesquisa" };

const TABS = [
  { value: "videos", label: "Videos" },
  { value: "canais", label: "Canais" },
  { value: "playlists", label: "Playlists" },
] as const;

type SearchTab = (typeof TABS)[number]["value"];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const { q, tab } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return <EmptyState icon={SearchX} title="Digite algo na busca para comecar" />;
  }

  const activeTab: SearchTab = TABS.some((t) => t.value === tab) ? (tab as SearchTab) : "videos";

  const [videos, channels, playlists] = await Promise.all([
    activeTab === "videos" ? searchVideos(query) : Promise.resolve([]),
    activeTab === "canais" ? searchChannels(query) : Promise.resolve([]),
    activeTab === "playlists" ? searchPlaylists(query) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`${ROUTES.search}?q=${encodeURIComponent(query)}&tab=${t.value}`}
            className={cn(
              "focus-ring border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
              activeTab === t.value ? "border-primary text-foreground" : "hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "videos" &&
        (videos.length === 0 ? (
          <EmptyState icon={SearchX} title={`Nenhum video para "${query}"`} />
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ))}

      {activeTab === "canais" &&
        (channels.length === 0 ? (
          <EmptyState icon={SearchX} title={`Nenhum canal para "${query}"`} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {channels.map((channel) => (
              <ChannelCard key={channel.slug} channel={channel} />
            ))}
          </div>
        ))}

      {activeTab === "playlists" &&
        (playlists.length === 0 ? (
          <EmptyState icon={SearchX} title={`Nenhuma playlist para "${query}"`} />
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ))}
    </div>
  );
}
