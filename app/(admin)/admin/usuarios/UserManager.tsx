"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserRole, deleteUser } from "./actions";
import type { Profile, UserRole } from "@/types/user.types";

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Aluno",
  professor: "Professor",
  admin: "Admin",
};

export function UserManager({ users, currentUserId }: { users: Profile[]; currentUserId: string | null }) {
  const [rows, setRows] = useState(users);
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (user) => user.full_name.toLowerCase().includes(term) || user.username.toLowerCase().includes(term)
    );
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar por nome ou usuário..."
          aria-label="Pesquisar contas"
          className="pl-9"
        />
      </div>

      {filteredRows.length === 0 ? (
        <p className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma conta encontrada para &quot;{query}&quot;
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {filteredRows.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              onDeleted={() => setRows((current) => current.filter((row) => row.id !== user.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function UserRow({ user, isSelf, onDeleted }: { user: Profile; isSelf: boolean; onDeleted: () => void }) {
  // Select do Radix e "uncontrolled" apos montar — se so usarmos
  // defaultValue, uma falha no servidor deixa o dropdown mostrando o papel
  // errado (o que foi clicado, nao o que persistiu). Guardar em estado e so
  // atualizar depois da confirmacao do servidor evita essa mentira na tela.
  const [role, setRole] = useState(user.role);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

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

  function handleDelete() {
    if (
      !confirm(
        `Remover a conta de @${user.username}? Isso apaga o perfil, canais, vídeos e comentários dessa conta permanentemente. Essa ação não pode ser desfeita.`
      )
    ) {
      return;
    }
    startDeleteTransition(async () => {
      try {
        await deleteUser(user.id);
        toast.success("Conta removida");
        onDeleted();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao remover conta");
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
      <div className="flex items-center gap-2">
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
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || isSelf}
          title={isSelf ? "Você não pode remover sua própria conta" : undefined}
          className="focus-ring flex items-center gap-1 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
