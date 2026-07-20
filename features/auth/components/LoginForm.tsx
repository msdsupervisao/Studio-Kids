"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthActionState } from "@/features/auth/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: AuthActionState = {};

// Deixa o que a pessoa digitar sempre valido como nome de usuario, em vez
// de barrar com erro — remove acentos, espaco vira underline, maiuscula
// vira minuscula, qualquer outro caractere e descartado.
const COMBINING_DIACRITICS = new RegExp("[̀-ͯ]", "g");

function sanitizeUsername(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.]/g, "");
}

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupUsername, setSignupUsername] = useState("");
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
            <Label htmlFor="identifier">Usuario ou e-mail</Label>
            <Input
              id="identifier"
              name="identifier"
              placeholder="seu_usuario"
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
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
            <Input
              id="username"
              name="username"
              placeholder="seu_usuario"
              required
              autoComplete="username"
              value={signupUsername}
              onChange={(event) => setSignupUsername(sanitizeUsername(event.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Sem espacos, acentos ou maiusculas — ajustamos automaticamente.
            </p>
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
