"use client";

import { useActionState, useState } from "react";
import { GraduationCap, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { slugify } from "@/utils/slug";
import { completeOnboarding, type OnboardingState } from "@/features/onboarding/actions/onboarding.actions";
import type { UserRole } from "@/types/user.types";

const initialState: OnboardingState = {};

export function OnboardingWizard({ fullName }: { fullName: string }) {
  const [role, setRole] = useState<Extract<UserRole, "student" | "professor"> | null>(null);
  const [wantsChannel, setWantsChannel] = useState(false);
  const [channelName, setChannelName] = useState(`Canal de ${fullName.split(" ")[0]}`);
  const [state, action, pending] = useActionState(completeOnboarding, initialState);

  // Criar canal exige as mesmas permissoes de professor no resto do app
  // (upload, area do professor) — por isso quem marca a opcao extra em
  // "Quero aprender" tambem e cadastrado como professor por baixo dos panos.
  const showChannelFields = role === "professor" || wantsChannel;
  const submittedRole = showChannelFields ? "professor" : role;

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Como você vai usar o Studio Kids?</h1>
        <p className="text-sm text-muted-foreground">Você pode mudar isso depois nas configurações.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("student")}
          className={cn(
            "focus-ring flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-colors",
            role === "student" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
          )}
        >
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium">Quero aprender</p>
            <p className="text-xs text-muted-foreground">Assistir aulas e seguir canais</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setRole("professor")}
          className={cn(
            "focus-ring flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-colors",
            role === "professor" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
          )}
        >
          <Presentation className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium">Quero ensinar</p>
            <p className="text-xs text-muted-foreground">Criar um canal e publicar aulas</p>
          </div>
        </button>
      </div>

      {role && (
        <form action={action} className="space-y-4">
          <input type="hidden" name="role" value={submittedRole ?? role} />

          {role === "student" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={wantsChannel}
                onChange={(event) => setWantsChannel(event.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              Também quero criar um canal para publicar vídeos
            </label>
          )}

          {showChannelFields && (
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
          )}

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Concluindo..." : "Concluir cadastro"}
          </Button>
        </form>
      )}
    </div>
  );
}
