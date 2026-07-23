"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserRole } from "./actions";
import type { Profile, UserRole } from "@/types/user.types";

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Aluno",
  professor: "Professor",
  admin: "Admin",
};

export function UserManager({ users }: { users: Profile[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {users.map((user) => (
        <UserRow key={user.id} user={user} />
      ))}
    </ul>
  );
}

function UserRow({ user }: { user: Profile }) {
  // Select do Radix e "uncontrolled" apos montar — se so usarmos
  // defaultValue, uma falha no servidor deixa o dropdown mostrando o papel
  // errado (o que foi clicado, nao o que persistiu). Guardar em estado e so
  // atualizar depois da confirmacao do servidor evita essa mentira na tela.
  const [role, setRole] = useState(user.role);
  const [isPending, startTransition] = useTransition();

  function handleChange(nextRole: UserRole) {
    const previousRole = role;
    setRole(nextRole);
    startTransition(async () => {
      try {
        await updateUserRole(user.id, nextRole);
        toast.success("Papel atualizado");
      } catch (error) {
        setRole(previousRole);
        toast.error(error instanceof Error ? error.message : "Falha ao atualizar papel");
      }
    });
  }

  return (
    <li className="flex items-center justify-between gap-4 p-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
          <AvatarFallback>{user.full_name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user.full_name}</p>
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      <Select value={role} onValueChange={(value) => handleChange(value as UserRole)} disabled={isPending}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </li>
  );
}
