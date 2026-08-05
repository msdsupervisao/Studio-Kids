import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Film, HardDrive, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/services/supabase/server";
import { getR2StorageUsage } from "@/services/storage/storage.actions";
import { StatsCards } from "@/features/estatisticas/components/StatsCards";
import { STORAGE_BUCKETS, STORAGE_PROVIDER } from "@/lib/constants";
import { formatBytes } from "@/utils/format";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = { title: "Storage" };

interface UsageByBucket {
  totalBytes: number;
  totalObjects: number;
  byBucket: Record<string, { bytes: number; objects: number }>;
}

/** Percorre um bucket do Supabase Storage recursivamente (pastas = item.id null) somando bytes. */
async function walkSupabaseBucket(
  supabase: SupabaseClient<Database>,
  bucket: string,
  prefix = ""
): Promise<{ bytes: number; objects: number }> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return { bytes: 0, objects: 0 };

  let bytes = 0;
  let objects = 0;
  for (const item of data) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      const nested = await walkSupabaseBucket(supabase, bucket, fullPath);
      bytes += nested.bytes;
      objects += nested.objects;
    } else {
      bytes += item.metadata?.size ?? 0;
      objects += 1;
    }
  }
  return { bytes, objects };
}

async function getSupabaseStorageUsage(supabase: SupabaseClient<Database>): Promise<UsageByBucket> {
  const byBucket: Record<string, { bytes: number; objects: number }> = {};
  let totalBytes = 0;
  let totalObjects = 0;

  for (const bucket of Object.values(STORAGE_BUCKETS)) {
    const usage = await walkSupabaseBucket(supabase, bucket);
    byBucket[bucket] = usage;
    totalBytes += usage.bytes;
    totalObjects += usage.objects;
  }

  return { totalBytes, totalObjects, byBucket };
}

export default async function AdminStoragePage() {
  const supabase = await createClient();
  const usage: UsageByBucket =
    STORAGE_PROVIDER === "r2" ? await getR2StorageUsage() : await getSupabaseStorageUsage(supabase);

  const videoBucketBytes = usage.byBucket[STORAGE_BUCKETS.videos]?.bytes ?? 0;
  const thumbnailBucketBytes = usage.byBucket[STORAGE_BUCKETS.thumbnails]?.bytes ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Storage</h1>
        <p className="text-sm text-muted-foreground">
          Uso de armazenamento em {STORAGE_PROVIDER === "r2" ? "Cloudflare R2" : "Supabase Storage"}.
        </p>
      </div>
      <StatsCards
        items={[
          { label: "Espaço usado no total", value: usage.totalBytes, icon: HardDrive, formatter: formatBytes },
          { label: "Arquivos no total", value: usage.totalObjects, icon: HardDrive },
          { label: "Espaço em videos/", value: videoBucketBytes, icon: Film, formatter: formatBytes },
          { label: "Espaço em thumbnails/", value: thumbnailBucketBytes, icon: ImageIcon, formatter: formatBytes },
        ]}
      />
      <div className="rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-medium">Detalhamento por bucket</p>
        <div className="space-y-2">
          {Object.entries(usage.byBucket).map(([bucket, { bytes, objects }]) => (
            <div key={bucket} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{bucket}/</span>
              <span>
                {formatBytes(bytes)} · {objects} {objects === 1 ? "arquivo" : "arquivos"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Limpeza de arquivos órfãos fica para uma próxima iteração.</p>
    </div>
  );
}
