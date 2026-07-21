"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ADMIN_NAV_ITEMS,
  APP_NAV_SECTIONS,
  PROFESSOR_NAV_ITEMS,
  type NavItem,
  type NavSection,
} from "@/components/layout/nav-config";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { ROUTES } from "@/lib/constants";

export type SidebarVariant = "app" | "professor" | "admin";

export interface SubscribedChannel {
  slug: string;
  name: string;
  avatarUrl: string | null;
}

const SECTIONS_BY_VARIANT: Record<SidebarVariant, NavSection[]> = {
  app: APP_NAV_SECTIONS,
  professor: [{ items: PROFESSOR_NAV_ITEMS }],
  admin: [{ items: ADMIN_NAV_ITEMS }],
};

// Os itens (com referencias de componentes de icone) sao resolvidos
// aqui dentro, no client, a partir de uma `variant` (string
// serializavel). Um Server Component nao pode passar funcoes (os
// icones) como prop para este componente — cruzar a fronteira
// servidor/cliente com um array contendo componentes quebra a
// serializacao do React Server Components.
export function Sidebar({
  variant,
  title,
  subscribedChannels = [],
}: {
  variant: SidebarVariant;
  title?: string;
  subscribedChannels?: SubscribedChannel[];
}) {
  const pathname = usePathname();
  const sections = SECTIONS_BY_VARIANT[variant];
  const { collapsed } = useSidebar();

  const wallpaper = variant === "app";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label={title ?? "Navegacao"}
      className={cn(
        "relative isolate flex gap-1 overflow-x-auto overflow-y-hidden border-b border-sidebar-border p-2 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-4 md:transition-[width] md:duration-200",
        collapsed ? "md:w-20" : "md:w-60",
        !wallpaper && "bg-sidebar",
        "md:overflow-y-auto"
      )}
    >
      {wallpaper && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src="/images/theme/sidebar-robotica.jpeg"
            alt=""
            fill
            sizes="240px"
            className="object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-sidebar/50 backdrop-blur-[1px]" />
        </div>
      )}
      {title && !collapsed && (
        <p className="hidden px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">
          {title}
        </p>
      )}
      {sections.map((section, index) => (
        <div key={section.title ?? index} className="flex shrink-0 gap-1 md:mb-3 md:flex-col md:gap-1">
          {section.title && !collapsed && (
            <p className="hidden px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block first:md:pt-0">
              {section.title}
            </p>
          )}
          {section.items.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
          ))}
          {section.title === "Inscricoes" && !collapsed && subscribedChannels.length > 0 && (
            <div className="hidden md:block">
              {subscribedChannels.map((channel) => (
                <Link
                  key={channel.slug}
                  href={ROUTES.channel(channel.slug)}
                  className={cn(
                    "focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(ROUTES.channel(channel.slug))
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-secondary"
                  )}
                >
                  {channel.avatarUrl ? (
                    <Image
                      src={channel.avatarUrl}
                      alt={channel.name}
                      width={20}
                      height={20}
                      className="h-5 w-5 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold">
                      {channel.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{channel.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "focus-ring flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:shrink",
        collapsed && "md:flex-col md:gap-1 md:px-1 md:py-3 md:text-center",
        active ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-secondary"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className={cn(collapsed && "md:text-[10px] md:leading-tight")}>{item.label}</span>
    </Link>
  );
}
