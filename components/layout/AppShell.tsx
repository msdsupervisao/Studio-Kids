import { Topbar } from "@/components/layout/Topbar";
import { Sidebar, type SidebarVariant } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import { PlayfulBackground } from "@/components/shared/PlayfulBackground";
import { getCurrentUser } from "@/features/auth/actions/auth.actions";
import { listMySubscribedChannelsForSidebar } from "@/features/canal/actions/channel.actions";

export async function AppShell({
  children,
  navVariant,
  navTitle,
}: {
  children: React.ReactNode;
  navVariant: SidebarVariant;
  navTitle?: string;
}) {
  const initialUser = await getCurrentUser();
  const subscribedChannels = navVariant === "app" && initialUser ? await listMySubscribedChannelsForSidebar() : [];

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Topbar initialUser={initialUser} wallpaper={navVariant === "app"} />
        <div className="flex flex-col md:flex-row">
          <Sidebar variant={navVariant} title={navTitle} subscribedChannels={subscribedChannels} />
          <main className="relative isolate min-w-0 flex-1 px-4 py-6 md:px-8">
            {navVariant === "app" && <PlayfulBackground />}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
