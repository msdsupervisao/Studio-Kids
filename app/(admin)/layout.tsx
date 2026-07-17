import { AppShell } from "@/components/layout/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navVariant="admin" navTitle="Administracao">
      {children}
    </AppShell>
  );
}
