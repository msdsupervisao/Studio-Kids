"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Shield, Tv, Upload, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { VoiceSearchButton } from "@/components/shared/VoiceSearchButton";
import { useSidebar } from "@/components/layout/SidebarProvider";
import { signOut } from "@/features/auth/actions/auth.actions";
import { markAllNotificationsAsRead } from "@/features/notificacoes/actions/notification.actions";
import { NotificationRow } from "@/features/notificacoes/components/NotificationRow";
import { useUser } from "@/hooks/use-user";
import { useNotifications } from "@/hooks/use-notifications";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/types/user.types";

export function Topbar({
  initialUser,
  wallpaper = false,
}: {
  initialUser: CurrentUser | null;
  wallpaper?: boolean;
}) {
  const router = useRouter();
  const { user } = useUser(initialUser);
  const { notifications, unreadCount } = useNotifications();
  const { toggle: toggleSidebar } = useSidebar();
  const [query, setQuery] = useState("");

  function runSearch(value: string) {
    const trimmed = value.trim();
    if (trimmed) router.push(`${ROUTES.search}?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(query);
  }

  function handleVoiceResult(transcript: string) {
    setQuery(transcript);
    runSearch(transcript);
  }

  const canUpload = user?.profile.role === "professor" || user?.profile.role === "admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 isolate flex h-16 items-center gap-4 overflow-hidden border-b border-border px-4",
        !wallpaper && "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      )}
    >
      {wallpaper && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src="/images/theme/topbar-lab.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_48%]"
          />
          <div className="absolute inset-0 bg-background/55 backdrop-blur-[1px]" />
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 md:inline-flex"
        onClick={toggleSidebar}
        aria-label="Abrir/recolher menu"
      >
        <Menu />
      </Button>

      <Link href={ROUTES.home} className="flex shrink-0 items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          E
        </span>
        <span className="hidden text-base font-semibold tracking-tight sm:inline">{APP_NAME}</span>
      </Link>

      <form onSubmit={handleSearch} className="mx-auto flex w-full max-w-xl items-center">
        <div className="flex w-full">
          <Input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar aulas, canais..."
            aria-label="Pesquisar"
            className="rounded-l-full rounded-r-none border-r-0 focus-visible:z-10"
          />
          <button
            type="submit"
            aria-label="Pesquisar"
            className="focus-ring flex w-14 shrink-0 items-center justify-center rounded-r-full border border-l-0 border-input bg-secondary text-muted-foreground transition-colors hover:bg-muted"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <VoiceSearchButton onResult={handleVoiceResult} />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {canUpload && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="hidden gap-2 rounded-full sm:inline-flex">
                <Plus className="h-4 w-4" /> Criar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={ROUTES.upload}><Upload /> Enviar video ou Short</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={ROUTES.newPlaylist}><Tv /> Criar playlist</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificacoes">
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-sm font-semibold">Notificacoes</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="focus-ring text-xs font-medium text-primary hover:underline"
                  onClick={() => markAllNotificationsAsRead()}
                >
                  Marcar tudo como lido
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhuma notificacao ainda</p>
            ) : (
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {notifications.slice(0, 8).map((notification) => (
                  <li key={notification.id}>
                    <NotificationRow notification={notification} compact />
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={ROUTES.notifications}
              className="focus-ring block border-t border-border px-3 py-2 text-center text-sm font-medium text-primary hover:bg-secondary"
            >
              Ver todas
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus-ring ml-1 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.profile.avatar_url ?? undefined} alt={user.profile.full_name} />
                <AvatarFallback>{user.profile.full_name.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.profile.full_name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={ROUTES.profile}>
                  <UserIcon /> Meu perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={ROUTES.settings}>
                  <Settings /> Configuracoes
                </Link>
              </DropdownMenuItem>
              {canUpload && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.myChannel}>
                      <Tv /> Meu canal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.professor}>
                      <LayoutDashboard /> Painel do professor
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              {user.profile.role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.admin}>
                    <Shield /> Painel admin
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void signOut()}>
                <LogOut /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
