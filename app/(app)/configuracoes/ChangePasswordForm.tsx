"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword, type PasswordActionState } from "./actions";

const initialState: PasswordActionState = {};

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (prevState: PasswordActionState, formData: FormData) => {
    const result = await updatePassword(prevState, formData);
    if (result.success) formRef.current?.reset();
    return result;
  }, initialState);

  return (
    <form ref={formRef} action={action} className="max-w-md space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
        <p className="text-xs text-muted-foreground">Minimo 8 caracteres, 1 maiuscula e 1 numero.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-success">Senha alterada.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
