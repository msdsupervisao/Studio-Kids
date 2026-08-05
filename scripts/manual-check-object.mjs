import { readFileSync } from "node:fs";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

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
const keys = process.argv.slice(2);

for (const key of keys) {
  try {
    const out = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`OK   ${key}  (${out.ContentLength} bytes)`);
  } catch (err) {
    console.log(`FAIL ${key}  -> ${err.name}: ${err.message}`);
  }
}
