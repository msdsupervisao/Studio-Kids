import { Topbar } from "@/components/layout/Topbar";
import { Sidebar, type SidebarVariant } from "@/components/layout/Sidebar";

export function AppShell({
  children,
  navVariant,
  navTitle,
}: {
  children: React.ReactNode;
  navVariant: SidebarVariant;
  navTitle?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="flex flex-col md:flex-row">
        <Sidebar variant={navVariant} title={navTitle} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
