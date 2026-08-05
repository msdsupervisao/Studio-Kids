import { readFileSync } from "node:fs";
import { S3Client, PutObjectCommand, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = env.R2_BUCKET_NAME;

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const BUCKETS = ["videos", "thumbnails", "avatars", "banners", "post-images"];

async function listAllSupabase(bucket, prefix = "") {
  const files = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit, offset, sortBy: { column: "name", order: "asc" } }),
    });
    const items = await res.json();
    if (!res.ok) throw new Error(`list ${bucket}/${prefix} falhou: ${JSON.stringify(items)}`);
    if (items.length === 0) break;
    for (const item of items) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listAllSupabase(bucket, fullPath)));
      else files.push({ path: fullPath, size: item.metadata?.size ?? 0, contentType: item.metadata?.mimetype });
    }
    if (items.length < limit) break;
    offset += limit;
  }
  return files;
}

async function listAllR2Keys(prefix) {
  const keys = new Map();
  let continuationToken;
  for (;;) {
    const out = await r2.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: continuationToken })
    );
    for (const obj of out.Contents ?? []) keys.set(obj.Key, obj.Size ?? 0);
    if (!out.IsTruncated) break;
    continuationToken = out.NextContinuationToken;
  }
  return keys;
}

async function copyFile(bucket, file) {
  const sourceUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${file.path}`;
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`download falhou (${res.status}): ${sourceUrl}`);
  const body = Buffer.from(await res.arrayBuffer());

  const key = `${bucket}/${file.path}`;
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: file.contentType || res.headers.get("content-type") || "application/octet-stream",
    })
  );
  return { key, bytes: body.length };
}

async function main() {
  const missing = [];
  const mismatched = [];

  for (const bucket of BUCKETS) {
    const supabaseFiles = await listAllSupabase(bucket);
    const r2Keys = await listAllR2Keys(`${bucket}/`);

    for (const file of supabaseFiles) {
      const key = `${bucket}/${file.path}`;
      if (!r2Keys.has(key)) {
        missing.push({ bucket, file, key });
      } else if (file.size && r2Keys.get(key) !== file.size) {
        mismatched.push({ bucket, file, key, r2Size: r2Keys.get(key) });
      }
    }
    console.log(`${bucket}: ${supabaseFiles.length} no Supabase, ${r2Keys.size} no R2`);
  }

  const toCopy = [...missing, ...mismatched];
  console.log(`\nFaltando no R2: ${missing.length}`);
  console.log(`Tamanho divergente: ${mismatched.length}`);
  for (const m of missing) console.log(`  FALTA: ${m.key} (${m.file.size} bytes)`);
  for (const m of mismatched) console.log(`  DIVERGE: ${m.key} (supabase=${m.file.size}, r2=${m.r2Size})`);

  if (toCopy.length === 0) {
    console.log("\nNada pendente. R2 já está sincronizado com o Supabase.");
    return;
  }

  console.log(`\nCopiando ${toCopy.length} arquivo(s) pendente(s)...`);
  const failures = [];
  for (const item of toCopy) {
    try {
      const result = await copyFile(item.bucket, item.file);
      console.log(`  OK: ${result.key} (${(result.bytes / 1024 / 1024).toFixed(2)} MB)`);
    } catch (err) {
      failures.push({ key: item.key, error: err.message });
      console.error(`  FALHOU: ${item.key} — ${err.message}`);
    }
  }

  console.log("\n--- resumo ---");
  if (failures.length === 0) {
    console.log(`Tudo sincronizado: ${toCopy.length} arquivo(s) copiado(s) sem falhas.`);
  } else {
    console.log(`${failures.length} falha(s):`);
    for (const f of failures) console.log(`  ${f.key}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
