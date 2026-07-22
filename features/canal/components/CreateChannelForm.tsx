"use client";

import { useActionState, useState } from "react";
import { createChannel, type ChannelActionState } from "@/features/canal/actions/channel.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/utils/slug";

const initialState: ChannelActionState = {};

export function CreateChannelForm() {
  const [name, setName] = useState("");
  const [state, action, pending] = useActionState(createChannel, initialState);

  return (
    <form action={action} className="max-w-md space-y-4 rounded-xl border border-border p-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome do canal</Label>
        <Input id="name" name="name" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="slug">Endereço</Label>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>/canal/</span>
          <Input id="slug" name="slug" defaultValue={slugify(name)} key={slugify(name)} required className="h-9" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Textarea id="description" name="description" maxLength={1000} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-success">Canal criado com sucesso.</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando..." : "Criar canal"}
      </Button>
    </form>
  );
}
