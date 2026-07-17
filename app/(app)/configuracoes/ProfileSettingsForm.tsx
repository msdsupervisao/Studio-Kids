"use client";

import { useActionState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile, type ProfileActionState } from "./actions";
import type { Profile } from "@/types/user.types";

const initialState: ProfileActionState = {};

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={action} className="max-w-md space-y-5">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
          <AvatarFallback className="text-lg">{profile.full_name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <Label htmlFor="avatarFile">Foto de perfil</Label>
          <Input id="avatarFile" name="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" name="fullName" defaultValue={profile.full_name} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">Nome de usuario</Label>
        <Input id="username" name="username" defaultValue={profile.username} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={500} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-success">Alteracoes salvas.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar alteracoes"}
      </Button>
    </form>
  );
}
