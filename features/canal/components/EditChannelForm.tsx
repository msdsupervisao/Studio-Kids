"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateChannel, type ChannelActionState } from "@/features/canal/actions/channel.actions";
import type { Channel } from "@/types/channel.types";

const initialState: ChannelActionState = {};

export function EditChannelForm({ channel }: { channel: Channel }) {
  const boundAction = updateChannel.bind(null, channel.id);
  const [state, action, pending] = useActionState(boundAction, initialState);
  const [bannerPreview, setBannerPreview] = useState<string | null>(channel.banner_url);

  return (
    <form action={action} className="max-w-xl space-y-6">
      <div className="space-y-1.5">
        <Label>Banner</Label>
        <div className="relative h-32 w-full overflow-hidden rounded-xl bg-secondary sm:h-40">
          {bannerPreview && <Image src={bannerPreview} alt="" fill sizes="100vw" className="object-cover" />}
        </div>
        <Input
          type="file"
          name="bannerFile"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setBannerPreview(URL.createObjectURL(file));
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={channel.avatar_url ?? undefined} alt={channel.name} />
          <AvatarFallback className="text-lg">{channel.name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <Label htmlFor="avatarFile">Avatar do canal</Label>
          <Input id="avatarFile" name="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Nome do canal</Label>
        <Input id="name" name="name" defaultValue={channel.name} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Endereço</Label>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>/canal/</span>
          <Input id="slug" name="slug" defaultValue={channel.slug} required className="h-9" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={channel.description ?? ""} maxLength={1000} />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-success">Alterações salvas.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
