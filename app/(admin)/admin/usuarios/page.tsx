import type { Metadata } from "next";
import { createClient } from "@/services/supabase/server";
import { UserManager } from "./UserManager";

export const metadata: Metadata = { title: "Usuários" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Usuários</h1>
      <UserManager users={users ?? []} />
    </div>
  );
}
