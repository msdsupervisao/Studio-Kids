"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPlaylist, type PlaylistActionState } from "@/features/playlist/actions/playlist.actions";

const initialState: PlaylistActionState = {};

export function PlaylistForm() {
  const [state, action, pending] = useActionState(createPlaylist, initialState);

  return (
    <form action={action} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Titulo</Label>
        <Input id="title" name="title" required maxLength={100} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Descricao (opcional)</Label>
        <Textarea id="description" name="description" maxLength={1000} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPublic" defaultChecked className="h-4 w-4 rounded border-input" />
        Playlist publica
      </label>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar playlist"}
      </Button>
    </form>
  );
}
