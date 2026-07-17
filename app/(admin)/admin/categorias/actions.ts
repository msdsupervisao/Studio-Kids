"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { slugify } from "@/utils/slug";
import { sanitizePlainText } from "@/utils/sanitize";
import { ROUTES } from "@/lib/constants";

export interface CategoryActionState {
  error?: string;
}

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const name = sanitizePlainText(String(formData.get("name") ?? ""));
  if (name.length < 2) return { error: "Nome muito curto" };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name, slug: slugify(name) });
  if (error) {
    if (error.code === "23505") return { error: "Ja existe uma categoria com esse nome" };
    return { error: "Nao foi possivel criar a categoria" };
  }

  revalidatePath(ROUTES.adminCategories);
  return {};
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) throw new Error(`Falha ao remover categoria: ${error.message}`);
  revalidatePath(ROUTES.adminCategories);
}
