import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListVideo } from "lucide-react";
import { getPlaylistWithVideos } from "@/features/playlist/actions/playlist.actions";
import { VideoCard } from "@/components/shared/VideoCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddVideosToPlaylist } from "@/features/playlist/components/AddVideosToPlaylist";
import { createClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const playlist = await getPlaylistWithVideos(id);
  return { title: playlist?.title ?? "Playlist" };
}

export default async function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlist = await getPlaylistWithVideos(id);
  if (!playlist) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === playlist.owner_id;

  if (!playlist.is_public && !isOwner) notFound();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const canUpload = profile?.role === "professor" || profile?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{playlist.title}</h1>
          {playlist.description && <p className="mt-1 text-sm text-muted-foreground">{playlist.description}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {playlist.videosCount} {playlist.videosCount === 1 ? "vídeo" : "vídeos"} ·{" "}
            {playlist.is_public ? "Pública" : "Privada"}
          </p>
        </div>
        {isOwner && (
          <AddVideosToPlaylist
            playlistId={playlist.id}
            initialVideoIds={playlist.videos.map((video) => video.id)}
            canUpload={canUpload}
          />
        )}
      </div>

      {playlist.videos.length === 0 ? (
        <EmptyState icon={ListVideo} title="Essa playlist ainda não tem vídeos" />
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlist.videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              editHref={isOwner && canUpload ? ROUTES.professorVideoEdit(video.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
