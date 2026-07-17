"use client";

import { useActionState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory, deleteCategory, type CategoryActionState } from "./actions";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const initialState: CategoryActionState = {};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(createCategory, initialState);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleDelete(id: string, name: string) {
    if (!confirm(`Remover a categoria "${name}"?`)) return;
    startDeleteTransition(async () => {
      try {
        await deleteCategory(id);
        toast.success("Categoria removida");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Falha ao remover categoria");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Categorias existentes</h2>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 p-3">
              <span className="text-sm">{category.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(category.id, category.name)}
                disabled={isDeleting}
                className="focus-ring rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                aria-label={`Remover ${category.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Nova categoria</h2>
        <form action={action} className="flex gap-2">
          <Input name="name" placeholder="Ex: Fotografia" required />
          <Button type="submit" disabled={pending}>
            {pending ? "Criando..." : "Adicionar"}
          </Button>
        </form>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </div>
  );
}
