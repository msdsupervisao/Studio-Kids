/**
 * Contas descartaveis para o e2e, seguindo a regra do CLAUDE.md: nunca
 * reusar a sessao real do usuario, criar/apagar via REST com a service
 * role. O service role SO e usado aqui para bootstrap de ambiente (criar
 * a conta, confirmar o e-mail interno que ninguem consegue confirmar de
 * verdade, e promover a conta de teste a admin — o mesmo que o README
 * instrui fazer manualmente no SQL Editor) — nunca para pular a logica
 * que o teste de fato exercita (upload, moderacao, etc. acontecem pela UI).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasServiceRole = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);

function adminHeaders() {
  return {
    apikey: SERVICE_ROLE_KEY as string,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

export function usernameToAuthEmail(username: string): string {
  return `${username}@contas.studiokids.internal`;
}

export interface DisposableAccount {
  id: string;
  username: string;
  email: string;
  password: string;
}

/** Cria uma conta ja confirmada (e-mail interno, ninguem confirmaria de verdade). */
export async function createDisposableAccount(options: {
  username: string;
  fullName: string;
  password: string;
}): Promise<DisposableAccount> {
  const email = usernameToAuthEmail(options.username);
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({
      email,
      password: options.password,
      email_confirm: true,
      user_metadata: { username: options.username, full_name: options.fullName },
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao criar conta descartável (${response.status}): ${await response.text()}`);
  }

  const user = await response.json();
  return { id: user.id as string, username: options.username, email, password: options.password };
}

/**
 * Promove a conta a admin. A migration 0005 adicionou um trigger
 * `protect_profile_privileges` (BEFORE UPDATE em profiles) que so aceita
 * mudanca de role vinda de quem ja e admin — inclusive a service role cai
 * nessa trava, porque a chamada nao carrega `auth.uid()`. Isso deixa o
 * passo do README ("promova sua conta a admin via SQL Editor") quebrado
 * hoje: um UPDATE simples esbarra no mesmo trigger, mesmo rodando como
 * postgres. Sem acesso a uma conexao Postgres direta nesta maquina (so
 * REST), o unico jeito de dar bootstrap num admin descartavel para o
 * teste e apagar a linha e reinseri-la — o trigger e BEFORE UPDATE,
 * entao um INSERT novo nao passa por ele. Vale reportar ao dono do
 * projeto: hoje so um admin logado consegue promover outro (via
 * /admin/usuarios), o que e seguro mas deixa a documentacao do README
 * desatualizada.
 */
export async function promoteToAdmin(userId: string): Promise<void> {
  const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
    headers: adminHeaders(),
  });
  if (!getResponse.ok) {
    throw new Error(`Falha ao ler perfil para promover a admin (${getResponse.status}): ${await getResponse.text()}`);
  }
  const [profile] = (await getResponse.json()) as Array<Record<string, unknown>>;
  if (!profile) throw new Error(`Perfil ${userId} não encontrado para promover a admin`);

  const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "DELETE",
    headers: { ...adminHeaders(), Prefer: "return=minimal" },
  });
  if (!deleteResponse.ok) {
    throw new Error(`Falha ao remover perfil temporariamente (${deleteResponse.status}): ${await deleteResponse.text()}`);
  }

  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...adminHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ ...profile, role: "admin", onboarding_completed_at: new Date().toISOString() }),
  });
  if (!insertResponse.ok) {
    throw new Error(`Falha ao reinserir perfil como admin (${insertResponse.status}): ${await insertResponse.text()}`);
  }
}

/** Busca o id de uma conta criada pelo próprio fluxo de cadastro da UI (não via REST), para poder limpar depois. */
export async function getUserIdByUsername(username: string): Promise<string | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?username=eq.${username}&select=id`, {
    headers: adminHeaders(),
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0]?.id ?? null;
}

/** Apaga a conta descartável — cascata apaga profile, canais e vídeos associados. */
export async function deleteDisposableAccount(userId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: adminHeaders(),
  }).catch(() => {});
}
