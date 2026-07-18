"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LayoutDashboard, LogOut, Search, Settings, Shield, Tv, Upload, User as UserIcon } from "lucide-react";
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
import { signOut } from "@/features/auth/actions/auth.actions";
import { markAllNotificationsAsRead } from "@/features/notificacoes/actions/notification.actions";
import { NotificationRow } from "@/features/notificacoes/components/NotificationRow";
import { useUser } from "@/hooks/use-user";
import { useNotifications } from "@/hooks/use-notifications";
import { APP_NAME, ROUTES } from "@/lib/constants";
import type { CurrentUser } from "@/types/user.types";

export function Topbar({ initialUser }: { initialUser: CurrentUser | null }) {
  const router = useRouter();
  const { user } = useUser(initialUser);
  const { notifications, unreadCount } = useNotifications();

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    if (query) router.push(`${ROUTES.search}?q=${encodeURIComponent(query)}`);
  }

  const canUpload = user?.profile.role === "professor" || user?.profile.role === "admin";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Link href={ROUTES.home} className="flex shrink-0 items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          E
        </span>
        <span className="hidden text-base font-semibold tracking-tight sm:inline">{APP_NAME}</span>
      </Link>

      <form onSubmit={handleSearch} className="mx-auto w-full max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" placeholder="Pesquisar aulas, canais..." className="pl-9" aria-label="Pesquisar" />
        </div>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {canUpload && (
          <Button asChild variant="outline" size="sm" className="hidden gap-2 sm:inline-flex">
            <Link href={ROUTES.upload}>
              <Upload className="h-4 w-4" />
              Enviar
            </Link>
          </Button>
        )}

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notificacoes">
              <Bell />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
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
