import { DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cliente do Cloudflare R2 (compativel com a API do S3). Usa a chave
 * secreta do R2 — NUNCA importar este arquivo em codigo que roda no
 * navegador; so os server actions em storage.actions.ts devem importar.
 * Um unico bucket real no R2 guarda tudo, com o "bucket" logico (videos,
 * thumbnails...) como prefixo da chave — evita ter que criar 5 buckets
 * separados no painel da Cloudflare so pra espelhar a estrutura de hoje.
 */

const PRESIGNED_UPLOAD_EXPIRES_SECONDS = 10 * 60;

let cachedClient: S3Client | null = null;

function r2Client(): S3Client {
  if (cachedClient) return cachedClient;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 não configurado — defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY no .env."
    );
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

function r2BucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2 não configurado — defina R2_BUCKET_NAME no .env.");
  return bucket;
}

/**
 * URL assinada de PUT, valida por poucos minutos — o navegador envia o
 * arquivo direto pro R2 via XMLHttpRequest, sem passar pelo nosso
 * servidor (mesmo padrão já usado com o Supabase Storage).
 */
export async function createR2PresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: r2BucketName(),
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });
  return getSignedUrl(r2Client(), command, { expiresIn: PRESIGNED_UPLOAD_EXPIRES_SECONDS });
}

/**
 * Lista todo objeto no bucket (paginado, 1000 por vez) com sua chave e
 * tamanho — usado pelo painel admin pra somar o total de espaco usado.
 * Bucket unico com tudo dentro (videos/thumbnails/avatars/...), entao uma
 * unica varredura sem prefixo cobre tudo.
 */
export async function listAllR2Objects(): Promise<Array<{ key: string; size: number }>> {
  const objects: Array<{ key: string; size: number }> = [];
  let continuationToken: string | undefined;

  do {
    const response = await r2Client().send(
      new ListObjectsV2Command({ Bucket: r2BucketName(), ContinuationToken: continuationToken })
    );
    for (const obj of response.Contents ?? []) {
      if (obj.Key) objects.push({ key: obj.Key, size: obj.Size ?? 0 });
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return objects;
}

export async function deleteR2Objects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await r2Client().send(
    new DeleteObjectsCommand({
      Bucket: r2BucketName(),
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    })
  );
}
