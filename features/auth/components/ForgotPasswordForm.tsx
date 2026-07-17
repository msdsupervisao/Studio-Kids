"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthActionState } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-sm text-foreground">
          Se existir uma conta com esse e-mail, enviamos um link para redefinir sua senha.
        </p>
        <Link href={ROUTES.login} className="text-sm text-primary hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="w-full max-w-sm space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required autoComplete="email" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link de recuperacao"}
      </Button>
      <Link href={ROUTES.login} className="block text-center text-sm text-muted-foreground hover:text-foreground">
        Voltar para o login
      </Link>
    </form>
  );
}
