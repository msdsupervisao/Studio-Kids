import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Clock3, Heart, History, ListVideo } from "lucide-react";
import { listWatchHistory } from "@/features/historico/actions/history.actions";
import { listLikedVideos } from "@/features/reacoes/actions/reaction.actions";
import { listMyPlaylists } from "@/features/playlist/actions/playlist.actions";
import { listWatchLater } from "@/features/watch-later/actions/watch-later.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { PlaylistCard } from "@/components/shared/PlaylistCard";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Biblioteca" };

export default async function LibraryPage() {
  const [history, liked, playlists, watchLater] = await Promise.all([
    listWatchHistory(),
    listLikedVideos(),
    listMyPlaylists(),
    listWatchLater(),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-xl font-semibold tracking-tight">Biblioteca</h1>

      <LibrarySection
        icon={History}
        title="Historico"
        seeAllHref={ROUTES.history}
        showSeeAll={history.length > 0}
        emptyText="Os videos que voce assistir aparecem aqui."
      >
        {history.slice(0, 4).map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </LibrarySection>

      <LibrarySection
        icon={Clock3}
        title="Ver mais tarde"
        seeAllHref={ROUTES.watchLater}
        showSeeAll={watchLater.length > 0}
        emptyText="Videos que voce salvar para depois aparecem aqui."
      >
        {watchLater.slice(0, 4).map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </LibrarySection>

      <LibrarySection
        icon={Heart}
        title="Videos curtidos"
        seeAllHref={ROUTES.liked}
        showSeeAll={liked.length > 0}
        emptyText="Videos que voce curtir aparecem aqui."
      >
        {liked.slice(0, 4).map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </LibrarySection>

      <LibrarySection
        icon={ListVideo}
        title="Suas playlists"
        seeAllHref={ROUTES.playlists}
        showSeeAll={playlists.length > 0}
        emptyText="Voce ainda nao criou nenhuma playlist."
      >
        {playlists.slice(0, 4).map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </LibrarySection>
    </div>
  );
}

function LibrarySection({
  icon: Icon,
  title,
  seeAllHref,
  showSeeAll,
  emptyText,
  children,
}: {
  icon: typeof History;
  title: string;
  seeAllHref: string;
  showSeeAll: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        {showSeeAll && (
          <Link
            href={seeAllHref}
            className="focus-ring flex items-center text-xs font-medium text-primary hover:underline"
          >
            Ver tudo <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {hasItems ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </section>
  );
}
