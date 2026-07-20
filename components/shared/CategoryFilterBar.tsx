import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export function CategoryFilterBar({
  categories,
  activeSlug,
  basePath,
}: {
  categories: CategoryRow[];
  activeSlug?: string;
  basePath: string;
}) {
  return (
    <div className="sticky top-16 z-30 -mx-4 flex gap-2 overflow-x-auto bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-8 md:px-8">
      <Link
        href={basePath}
        className={cn(
          "focus-ring shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !activeSlug ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
        )}
      >
        Todas
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`${basePath}?categoria=${category.slug}`}
          className={cn(
            "focus-ring shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            activeSlug === category.slug
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-secondary"
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
