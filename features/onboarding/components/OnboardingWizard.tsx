"use client";

import { useActionState, useState } from "react";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/utils/slug";
import { completeOnboarding, type OnboardingState } from "@/features/onboarding/actions/onboarding.actions";

const initialState: OnboardingState = {};

export function OnboardingWizard({ fullName }: { fullName: string }) {
  const [channelName, setChannelName] = useState(`Canal de ${fullName.split(" ")[0]}`);
  const [state, action, pending] = useActionState(completeOnboarding, initialState);

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="space-y-2 text-center">
        <Rocket className="mx-auto h-10 w-10 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Sua criatividade + a tecnologia são um superpoder!</h1>
        <p className="text-sm text-muted-foreground">
          Toda grande ideia começou em algum lugar. Crie seu canal e comece a compartilhar o que você aprende com o
          mundo.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="role" value="professor" />

        <div className="space-y-4 rounded-xl border border-border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="channelName">Nome do canal</Label>
            <Input
              id="channelName"
              name="channelName"
              value={channelName}
              onChange={(event) => setChannelName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="channelSlug">Endereço do canal</Label>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>studiokids.com/canal/</span>
              <Input
                id="channelSlug"
                name="channelSlug"
                defaultValue={slugify(channelName)}
                key={slugify(channelName)}
                required
                className="h-9"
              />
            </div>
          </div>
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Criando seu canal..." : "Criar meu canal"}
        </Button>
      </form>
    </div>
  );
}
