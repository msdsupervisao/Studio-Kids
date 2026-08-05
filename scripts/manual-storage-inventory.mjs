import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKETS = ["videos", "thumbnails", "avatars", "banners", "post-images"];

async function listAll(bucket, prefix = "") {
  const files = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const res = await fetch(`${URL_BASE}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefix, limit, offset, sortBy: { column: "name", order: "asc" } }),
    });
    const items = await res.json();
    if (!res.ok) throw new Error(`list ${bucket}/${prefix} falhou: ${JSON.stringify(items)}`);
    if (items.length === 0) break;

    for (const item of items) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // "pasta" — recursa
        const nested = await listAll(bucket, fullPath);
        files.push(...nested);
      } else {
        files.push({ path: fullPath, size: item.metadata?.size ?? 0 });
      }
    }
    if (items.length < limit) break;
    offset += limit;
  }
  return files;
}

async function main() {
  let totalFiles = 0;
  let totalBytes = 0;
  for (const bucket of BUCKETS) {
    const files = await listAll(bucket);
    const bytes = files.reduce((sum, f) => sum + f.size, 0);
    totalFiles += files.length;
    totalBytes += bytes;
    console.log(`${bucket}: ${files.length} arquivos, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  }
  console.log(`TOTAL: ${totalFiles} arquivos, ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
