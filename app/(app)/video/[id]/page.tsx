import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VideoPlayer } from "@/features/video/components/VideoPlayer";
import { RelatedVideos } from "@/features/video/components/RelatedVideos";
import { SubscribeButton } from "@/features/inscricoes/components/SubscribeButton";
import { CommentForm } from "@/features/comentarios/components/CommentForm";
import { CommentList } from "@/features/comentarios/components/CommentList";
import { getVideoDetail, getRelatedVideos } from "@/features/video/actions/video.actions";
import { listComments } from "@/features/comentarios/actions/comment.actions";
import { createClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";
import { formatCompactNumber, formatRelativeDate } from "@/utils/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoDetail(id);
  return { title: video?.title ?? "Video" };
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

  const [related, comments] = await Promise.all([
    getRelatedVideos(video.id, video.channel.id),
    listComments(video.id),
  ]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <VideoPlayer src={video.videoUrl} poster={video.thumbnailUrl} title={video.title} />

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

            <SubscribeButton
              channelId={video.channel.id}
              channelSlug={video.channel.slug}
              initialSubscribed={video.isSubscribed}
              initialCount={video.subscribersCount}
              isOwnChannel={user?.id === video.channel.owner_id}
            />
          </div>

          {video.description && (
            <div className="rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {formatCompactNumber(video.views_count)} visualizacoes ·{" "}
                {video.published_at && formatRelativeDate(video.published_at)}
              </p>
              <p className="whitespace-pre-wrap">{video.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold">{comments.length} comentarios</h2>
          {user ? (
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
      </div>

      <aside>
        <h2 className="mb-3 text-sm font-semibold">Mais desse canal</h2>
        <RelatedVideos videos={related} />
      </aside>
    </div>
  );
}
