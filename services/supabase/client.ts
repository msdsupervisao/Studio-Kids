import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";
import { sessionOnlyCookieOptions } from "@/services/supabase/cookie-options";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase para Client Components (roda no navegador). Le/grava
 * cookie na mao (em vez de deixar o @supabase/ssr usar seu padrao
 * interno) so pra poder tirar o maxAge de 400 dias fixo — ver
 * cookie-options.ts para o motivo.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const parsed = parse(document.cookie);
          return Object.entries(parsed).map(([name, value]) => ({ name, value: value ?? "" }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serialize(name, value, sessionOnlyCookieOptions(options));
          });
        },
      },
    }
  );
}
