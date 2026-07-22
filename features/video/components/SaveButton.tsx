"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ListPlus, ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  type PlaylistMembership,
} from "@/features/playlist/actions/playlist.actions";
import { ROUTES } from "@/lib/constants";

export function SaveButton({
  videoId,
  isLoggedIn,
  initialPlaylists,
}: {
  videoId: string;
  isLoggedIn: boolean;
  initialPlaylists: PlaylistMembership[];
}) {
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [, startTransition] = useTransition();

  function toggle(playlistId: string, nextChecked: boolean) {
    setPlaylists((current) =>
      current.map((playlist) =>
        playlist.id === playlistId ? { ...playlist, containsVideo: nextChecked } : playlist
      )
    );
    startTransition(async () => {
      try {
        if (nextChecked) await addVideoToPlaylist(playlistId, videoId);
        else await removeVideoFromPlaylist(playlistId, videoId);
      } catch {
        setPlaylists((current) =>
          current.map((playlist) =>
            playlist.id === playlistId ? { ...playlist, containsVideo: !nextChecked } : playlist
          )
        );
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <ListPlus className="h-4 w-4" /> Salvar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Salvar em...</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!isLoggedIn ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            <Link href={ROUTES.login} className="text-primary hover:underline">
              Entre
            </Link>{" "}
            para salvar em uma playlist.
          </p>
        ) : playlists.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Você ainda não tem playlists.</p>
        ) : (
          playlists.map((playlist) => (
            <DropdownMenuCheckboxItem
              key={playlist.id}
              checked={playlist.containsVideo}
              onCheckedChange={(checked) => toggle(playlist.id, checked === true)}
              onSelect={(event) => event.preventDefault()}
            >
              {playlist.title}
            </DropdownMenuCheckboxItem>
          ))
        )}
        {isLoggedIn && (
          <>
            <DropdownMenuSeparator />
            <Link
              href={ROUTES.newPlaylist}
              className="focus-ring flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
            >
              <ListVideo className="h-4 w-4" /> Nova playlist
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
