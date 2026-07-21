import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, Tv } from "lucide-react";
import { createClient } from "@/services/supabase/server";
import { getMyChannels } from "@/features/canal/actions/channel.actions";
import { listCategories } from "@/features/video/actions/video.actions";
import { getPlaylistWithVideos } from "@/features/playlist/actions/playlist.actions";
import { VideoForm } from "@/features/video/components/VideoForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Enviar video" };

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ playlist?: string }>;
}) {
  const { playlist: targetPlaylistId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (!profile || (profile.role !== "professor" && profile.role !== "admin")) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Apenas professores podem enviar videos"
        description="Fale com a nossa equipe se voce quer se tornar um professor no Studio Kids."
      />
    );
  }

  const [channels, categories, targetPlaylist] = await Promise.all([
    getMyChannels(),
    listCategories(),
    targetPlaylistId ? getPlaylistWithVideos(targetPlaylistId) : Promise.resolve(null),
  ]);

  if (channels.length === 0) {
    return (
      <EmptyState
        icon={Tv}
        title="Voce ainda nao tem um canal"
        description="Crie um canal antes de enviar sua primeira aula."
        action={
          <Button asChild>
            <Link href={ROUTES.professorChannels}>Criar canal</Link>
          </Button>
        }
      />
    );
  }

  const ownsTargetPlaylist = targetPlaylist && user && targetPlaylist.owner_id === user.id;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Enviar video</h1>
      <VideoForm
        channels={channels}
        categories={categories}
        targetPlaylistId={ownsTargetPlaylist ? targetPlaylist.id : undefined}
        targetPlaylistTitle={ownsTargetPlaylist ? targetPlaylist.title : undefined}
      />
    </div>
  );
}
