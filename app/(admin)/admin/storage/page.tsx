import type { Metadata } from "next";
import { Film, HardDrive, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/services/supabase/server";
import { StatsCards } from "@/features/estatisticas/components/StatsCards";

export const metadata: Metadata = { title: "Storage" };

export default async function AdminStoragePage() {
  const supabase = await createClient();
  const [{ data: videos }, { data: thumbnails }] = await Promise.all([
    supabase.storage.from("videos").list(),
    supabase.storage.from("thumbnails").list(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Storage</h1>
        <p className="text-sm text-muted-foreground">
          Visao rapida dos buckets do Supabase Storage usados pelo EduTube.
        </p>
      </div>
      <StatsCards
        items={[
          { label: "Pastas em videos/", value: videos?.length ?? 0, icon: Film },
          { label: "Pastas em thumbnails/", value: thumbnails?.length ?? 0, icon: ImageIcon },
          { label: "Buckets configurados", value: 4, icon: HardDrive },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Detalhamento por arquivo, uso em bytes e limpeza de orfaos ficam para uma proxima iteracao (ver ROADMAP.md).
      </p>
    </div>
  );
}
