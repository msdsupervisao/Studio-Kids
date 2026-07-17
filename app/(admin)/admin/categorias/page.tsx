import type { Metadata } from "next";
import { listCategories } from "@/features/video/actions/video.actions";
import { CategoryManager } from "./CategoryManager";

export const metadata: Metadata = { title: "Categorias" };

export default async function AdminCategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Categorias</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
