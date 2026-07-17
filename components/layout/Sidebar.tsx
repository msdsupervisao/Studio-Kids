"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, APP_NAV_ITEMS, PROFESSOR_NAV_ITEMS } from "@/components/layout/nav-config";

export type SidebarVariant = "app" | "professor" | "admin";

const ITEMS_BY_VARIANT = {
  app: APP_NAV_ITEMS,
  professor: PROFESSOR_NAV_ITEMS,
  admin: ADMIN_NAV_ITEMS,
};

// Os itens (com referencias de componentes de icone) sao resolvidos
// aqui dentro, no client, a partir de uma `variant` (string
// serializavel). Um Server Component nao pode passar funcoes (os
// icones) como prop para este componente — cruzar a fronteira
// servidor/cliente com um array contendo componentes quebra a
// serializacao do React Server Components.
export function Sidebar({ variant, title }: { variant: SidebarVariant; title?: string }) {
  const pathname = usePathname();
  const items = ITEMS_BY_VARIANT[variant];

  return (
    <nav
      aria-label={title ?? "Navegacao"}
      className="flex gap-1 overflow-x-auto border-b border-sidebar-border bg-sidebar p-2 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-60 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-4"
    >
      {title && (
        <p className="hidden px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "focus-ring flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:shrink",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-secondary"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
