import { AppShell } from "@/components/layout/AppShell";

export default function ProfessorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navVariant="professor" navTitle="Area do professor">
      {children}
    </AppShell>
  );
}
