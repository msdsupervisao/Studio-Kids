import { readFileSync } from "node:fs";
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

async function countR2(prefix) {
  let count = 0;
  let continuationToken;
  for (;;) {
    const out = await r2.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: continuationToken })
    );
    count += out.Contents?.length ?? 0;
    if (!out.IsTruncated) break;
    continuationToken = out.NextContinuationToken;
  }
  return count;
}

async function main() {
  const failures = [];
  for (const bucket of BUCKETS) {
    const files = await listAllSupabase(bucket);
    console.log(`\n${bucket}: ${files.length} arquivos a copiar`);
    let done = 0;
    for (const file of files) {
      try {
        await copyFile(bucket, file);
        done++;
      } catch (err) {
        failures.push({ bucket, path: file.path, error: err.message });
        console.error(`  FALHOU: ${bucket}/${file.path} — ${err.message}`);
      }
    }
    console.log(`  copiados: ${done}/${files.length}`);

    const r2Count = await countR2(`${bucket}/`);
    console.log(`  conferido no R2: ${r2Count} objetos com prefixo ${bucket}/`);
  }

  console.log("\n--- resumo ---");
  if (failures.length === 0) {
    console.log("Tudo copiado sem falhas.");
  } else {
    console.log(`${failures.length} falha(s):`);
    for (const f of failures) console.log(`  ${f.bucket}/${f.path}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
