"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ListPlus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { searchVideos } from "@/features/video/actions/video.actions";
import { addVideoToPlaylist, removeVideoFromPlaylist } from "@/features/playlist/actions/playlist.actions";
import { formatDuration } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { VideoCardData } from "@/types/video.types";

const SEARCH_DEBOUNCE_MS = 350;

export function AddVideosToPlaylist({
  playlistId,
  initialVideoIds,
}: {
  playlistId: string;
  initialVideoIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VideoCardData[]>([]);
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState(() => new Set(initialVideoIds));
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changedRef = useRef(false);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const videos = await searchVideos(value);
      setResults(videos);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
  }

  function toggleVideo(videoId: string) {
    const alreadyAdded = addedIds.has(videoId);
    changedRef.current = true;
    setAddedIds((current) => {
      const next = new Set(current);
      if (alreadyAdded) next.delete(videoId);
      else next.add(videoId);
      return next;
    });

    startTransition(async () => {
      try {
        if (alreadyAdded) await removeVideoFromPlaylist(playlistId, videoId);
        else await addVideoToPlaylist(playlistId, videoId);
      } catch {
        setAddedIds((current) => {
          const next = new Set(current);
          if (alreadyAdded) next.add(videoId);
          else next.delete(videoId);
          return next;
        });
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next && changedRef.current) {
      changedRef.current = false;
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <ListPlus className="h-4 w-4" /> Adicionar videos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar videos a playlist</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Buscar aulas por titulo..."
            className="pl-9"
          />
        </div>

        <div className="mt-4 space-y-1">
          {!query.trim() && (
            <p className="py-8 text-center text-sm text-muted-foreground">Digite para buscar videos.</p>
          )}
          {query.trim() && searching && (
            <p className="py-8 text-center text-sm text-muted-foreground">Buscando...</p>
          )}
          {query.trim() && !searching && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum video encontrado.</p>
          )}
          {results.map((video) => {
            const added = addedIds.has(video.id);
            return (
              <button
                key={video.id}
                type="button"
                onClick={() => toggleVideo(video.id)}
                className="focus-ring flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-secondary"
              >
                <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  {video.thumbnailUrl && (
                    <Image src={video.thumbnailUrl} alt={video.title} fill sizes="80px" className="object-cover" />
                  )}
                  {video.durationSeconds > 0 && (
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[10px] font-medium text-white">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{video.title}</p>
                  <p className="text-xs text-muted-foreground">{video.channel.name}</p>
                </div>
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                    added ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                  )}
                >
                  {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
