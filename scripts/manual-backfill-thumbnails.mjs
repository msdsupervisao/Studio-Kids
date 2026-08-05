import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
const R2_BUCKET = env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, "");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

function adminHeaders() {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };
}

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/videos?thumbnail_path=is.null&select=id,title,video_path`, {
    headers: adminHeaders(),
  });
  const videos = await res.json();
  console.log(`${videos.length} vídeo(s) sem miniatura.`);

  for (const video of videos) {
    console.log(`\n${video.title} (${video.id})`);
    const videoUrl = `${R2_PUBLIC_URL}/videos/${video.video_path}`;
    const channelId = video.video_path.split("/")[0];
    const extension = video.video_path.split(".").pop() ?? "mp4";
    const localVideoPath = join(tmpdir(), `backfill-${video.id}.${extension}`);
    const localThumbPath = join(tmpdir(), `backfill-${video.id}.jpg`);

    try {
      console.log(`  baixando ${videoUrl}`);
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) throw new Error(`download falhou: HTTP ${videoRes.status}`);
      writeFileSync(localVideoPath, Buffer.from(await videoRes.arrayBuffer()));

      console.log("  extraindo frame com ffmpeg");
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-i", localVideoPath,
          "-ss", "00:00:01",
          "-vframes", "1",
          "-vf", "scale=1280:-1",
          localThumbPath,
        ],
        { stdio: "pipe" }
      );

      const thumbBuffer = readFileSync(localThumbPath);
      const thumbnailPath = `${channelId}/${video.id}.jpg`;

      console.log(`  enviando thumbnails/${thumbnailPath} pro R2 (${(thumbBuffer.length / 1024).toFixed(0)} KB)`);
      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: `thumbnails/${thumbnailPath}`,
          Body: thumbBuffer,
          ContentType: "image/jpeg",
        })
      );

      console.log("  atualizando videos.thumbnail_path");
      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/videos?id=eq.${video.id}`, {
        method: "PATCH",
        headers: { ...adminHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ thumbnail_path: thumbnailPath }),
      });
      if (!patchRes.ok) throw new Error(`update falhou: HTTP ${patchRes.status} ${await patchRes.text()}`);

      console.log("  OK");
    } catch (err) {
      console.error(`  FALHOU: ${err.message}`);
    } finally {
      try { unlinkSync(localVideoPath); } catch {}
      try { unlinkSync(localThumbPath); } catch {}
    }
  }
}

main().catch((err) => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
