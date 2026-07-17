import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase para Server Components, Server Actions e Route
 * Handlers. O `set` de cookies falha silenciosamente quando chamado a
 * partir de um Server Component puro (Next nao permite escrever
 * cookies fora de Server Actions/Route Handlers) — o middleware.ts
 * raiz e quem garante que a sessao seja refrescada nesse caso.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado a partir de um Server Component — ignorado de proposito.
          }
        },
      },
    }
  );
}

/**
 * Cliente com service role — ignora RLS. Uso restrito a operacoes de
 * backend que precisam agir independente do usuario logado (ex: enviar
 * notificacao para outro usuario, jobs administrativos). NUNCA importar
 * em codigo que roda no cliente.
 */
export function createServiceRoleClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Cliente service-role nao mantem sessao de usuario.
        },
      },
    }
  );
}
