import { readFileSync } from "node:fs";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const BUCKET = env.R2_BUCKET_NAME;

async function main() {
  let totalFiles = 0;
  let totalBytes = 0;
  let continuationToken;
  for (;;) {
    const out = await r2.send(new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: continuationToken }));
    for (const obj of out.Contents ?? []) {
      totalFiles++;
      totalBytes += obj.Size ?? 0;
    }
    if (!out.IsTruncated) break;
    continuationToken = out.NextContinuationToken;
  }
  console.log(`R2 total: ${totalFiles} arquivos, ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
