"use client";

import { useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  function handleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        toast.success("Papel atualizado");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao atualizar papel");
      }
    });
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {users.map((user) => (
        <li key={user.id} className="flex items-center justify-between gap-4 p-3">
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
          <Select
            defaultValue={user.role}
            onValueChange={(value) => handleChange(user.id, value as UserRole)}
            disabled={isPending}
          >
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
      ))}
    </ul>
  );
}
