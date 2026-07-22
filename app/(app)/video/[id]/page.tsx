import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPlayer } from "@/features/video/components/VideoPlayer";
import { VideoDescription } from "@/features/video/components/VideoDescription";
import { RelatedVideos } from "@/features/video/components/RelatedVideos";
import { WatchLayout } from "@/features/video/components/WatchLayout";
import { ShareButton } from "@/features/video/components/ShareButton";
import { SaveButton } from "@/features/video/components/SaveButton";
import { WatchLaterButton } from "@/features/video/components/WatchLaterButton";
import { SubscribeButton } from "@/features/inscricoes/components/SubscribeButton";
import { VideoReactions } from "@/features/reacoes/components/VideoReactions";
import { CommentForm } from "@/features/comentarios/components/CommentForm";
import { CommentList } from "@/features/comentarios/components/CommentList";
import { getVideoDetail, getRelatedVideos } from "@/features/video/actions/video.actions";
import { getVideoReactionSummary } from "@/features/reacoes/actions/reaction.actions";
import { listComments } from "@/features/comentarios/actions/comment.actions";
import { listMyPlaylistsForVideo } from "@/features/playlist/actions/playlist.actions";
import { isInWatchLater } from "@/features/watch-later/actions/watch-later.actions";
import { createClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";
import { formatCompactNumber } from "@/utils/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoDetail(id);
  return { title: video?.title ?? "Vídeo" };
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Nota: increment_video_views roda a cada carregamento desta pagina
  // (inclusive refresh manual), entao a contagem e uma aproximacao, nao
  // um "unique view" real. Uma versao futura pode deduplicar por
  // usuario/sessao em video_progress.
  const video = await getVideoDetail(id);
  if (!video) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [related, comments, reactions, playlists, savedForLater] = await Promise.all([
    getRelatedVideos(video.id, video.channel.id),
    listComments(video.id),
    getVideoReactionSummary(video.id),
    listMyPlaylistsForVideo(video.id),
    isInWatchLater(video.id),
  ]);

  return (
    <WatchLayout
      player={
        <VideoPlayer
          videoId={video.id}
          src={video.videoUrl}
          poster={video.thumbnailUrl}
          title={video.title}
          durationSeconds={video.duration_seconds}
        />
      }
      details={
        <>
          <div className="space-y-4">
            <h1 className="text-xl font-semibold tracking-tight">{video.title}</h1>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href={ROUTES.channel(video.channel.slug)} className="focus-ring flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={video.channel.avatar_url ?? undefined} alt={video.channel.name} />
                  <AvatarFallback>{video.channel.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{video.channel.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCompactNumber(video.subscribersCount)} inscritos
                  </p>
                </div>
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <SubscribeButton
                  channelId={video.channel.id}
                  channelSlug={video.channel.slug}
                  initialSubscribed={video.isSubscribed}
                  initialCount={video.subscribersCount}
                  isOwnChannel={user?.id === video.channel.owner_id}
                />
                <VideoReactions
                  videoId={video.id}
                  initialLikes={reactions.likesCount}
                  initialReaction={reactions.userReaction}
                />
                <ShareButton videoId={video.id} />
                <WatchLaterButton videoId={video.id} isLoggedIn={Boolean(user)} initialSaved={savedForLater} />
                <SaveButton videoId={video.id} isLoggedIn={Boolean(user)} initialPlaylists={playlists} />
              </div>
            </div>

            {video.description && (
              <VideoDescription
                description={video.description}
                viewsCount={video.views_count}
                publishedAt={video.published_at}
              />
            )}
          </div>

          <div id="comentarios" className="space-y-4 scroll-mt-20">
            <h2 className="text-sm font-semibold">{comments.length} comentários</h2>
            {video.status !== "published" ? (
              <p className="text-sm text-muted-foreground">
                Os comentários ficam disponíveis depois que o vídeo for aprovado.
              </p>
            ) : user ? (
              <CommentForm videoId={video.id} />
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href={ROUTES.login} className="text-primary hover:underline">
                  Entre
                </Link>{" "}
                para comentar.
              </p>
            )}
            <CommentList videoId={video.id} comments={comments} currentUserId={user?.id} />
          </div>
        </>
      }
      related={
        <>
          <h2 className="mb-3 text-sm font-semibold">Mais desse canal</h2>
          <RelatedVideos videos={related} />
        </>
      }
    />
  );
}
