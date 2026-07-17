import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listMyPlaylists } from "@/features/playlist/actions/playlist.actions";
import { PlaylistGrid } from "@/features/playlist/components/PlaylistGrid";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Playlists" };

export default async function PlaylistsPage() {
  const playlists = await listMyPlaylists();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Minhas playlists</h1>
        <Button asChild size="sm" className="gap-2">
          <Link href={ROUTES.newPlaylist}>
            <Plus className="h-4 w-4" />
            Nova playlist
          </Link>
        </Button>
      </div>
      <PlaylistGrid playlists={playlists} />
    </div>
  );
}
