/**
 * Faz a sessao nao sobreviver ao navegador fechar — necessario pra
 * maquina compartilhada da escola, onde cada aluno deveria ter que
 * logar de novo (sem isso, quem senta depois entra direto na conta de
 * quem usou por ultimo).
 *
 * O @supabase/ssr sempre grava cookie de sessao com 400 dias fixos —
 * mesmo passando `cookieOptions` customizado pro client, a lib
 * reescreve maxAge por cima na hora de gravar (visto no codigo fonte:
 * `{...cookieOptions, maxAge: DEFAULT_COOKIE_OPTIONS.maxAge}`). O unico
 * jeito de mudar isso e interceptar o cookie de verdade sendo escrito
 * (nos tres `setAll` da app: client.ts, server.ts, middleware.ts) e
 * remover maxAge/expires manualmente — sem essas duas propriedades, o
 * navegador trata como cookie de sessao (some ao fechar de verdade, nao
 * so ao fechar a aba).
 *
 * maxAge <= 0 e como a lib pede pra APAGAR um cookie (sign-out, limpeza
 * de chunk antigo de uma sessao anterior) — esse caso precisa manter o
 * maxAge original, senao o navegador nunca chega a remover o cookie.
 */
export function sessionOnlyCookieOptions<T extends { maxAge?: number; expires?: unknown }>(options: T): T {
  if (!options.maxAge || options.maxAge <= 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
