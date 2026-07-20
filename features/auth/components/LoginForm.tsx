"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthActionState } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signUp, initialState);

  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex rounded-lg bg-secondary p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={cn(
            "focus-ring flex-1 rounded-md py-2 text-sm font-medium transition-colors",
            mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"
          )}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={cn(
            "focus-ring flex-1 rounded-md py-2 text-sm font-medium transition-colors",
            mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"
          )}
        >
          Criar conta
        </button>
      </div>

      {mode === "login" ? (
        <form action={loginAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href={ROUTES.forgotPassword} className="text-xs text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <PasswordInput id="password" name="password" required autoComplete="current-password" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      ) : (
        <form action={signupAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" name="fullName" placeholder="Seu nome" required autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Nome de usuario</Label>
            <Input id="username" name="username" placeholder="seu_usuario" required autoComplete="username" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-email">E-mail</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signup-password">Senha</Label>
            <PasswordInput
              id="signup-password"
              name="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">Minimo 8 caracteres, 1 maiuscula e 1 numero.</p>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      )}
    </div>
  );
}
