import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  experimental: {
    // Server Actions tem limite padrao de 1MB no corpo da requisicao.
    // Video e thumbnail vao direto do navegador para o Supabase Storage
    // (hooks/use-upload.ts), entao a unica coisa grande que ainda passa
    // por Server Action e avatar/banner de canal (ate 5MB, ver
    // UPLOAD_LIMITS em lib/constants.ts).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
