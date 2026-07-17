"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types/user.types";

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(`Falha ao atualizar papel do usuario: ${error.message}`);
  revalidatePath(ROUTES.adminUsers);
}
