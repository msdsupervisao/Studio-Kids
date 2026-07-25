import { vi } from "vitest";

/**
 * Resultado configurado de uma chamada de query. `data`/`error` cobrem o
 * formato retornado pelo supabase-js em qualquer ponto da cadeia (.single(),
 * .maybeSingle() ou aguardar o builder direto).
 */
export interface QueryResult<T = unknown> {
  data?: T | null;
  error?: { message: string; code?: string } | null;
  count?: number | null;
}

/**
 * Builder falso que imita a API fluente do supabase-js (.from().select()
 * .eq()...). Todo metodo de encadeamento retorna o proprio builder; o
 * builder e "thenable" (implementa .then) para que `await query` funcione
 * tanto com `.single()`/`.maybeSingle()` quanto quando o codigo aguarda o
 * builder diretamente (ex: `await query.overrideTypes()`).
 */
export function queryResult<T = unknown>(result: QueryResult<T>) {
  const resolved = { data: null, error: null, count: null, ...result };

  const builder: Record<string, unknown> = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    order: () => builder,
    limit: () => builder,
    ilike: () => builder,
    overrideTypes: () => builder,
    single: () => Promise.resolve(resolved),
    maybeSingle: () => Promise.resolve(resolved),
    then: (onFulfilled?: (value: typeof resolved) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(resolved).then(onFulfilled, onRejected),
  };

  return builder;
}

export interface MockUser {
  id: string;
  email?: string;
}

/**
 * Cliente Supabase falso. `from` e `rpc` sao vi.fn() sem comportamento
 * padrao — cada teste configura o retorno com `.mockReturnValueOnce(...)`
 * (ou `.mockResolvedValueOnce(...)` no caso de `rpc`) na ordem em que a
 * Server Action sob teste os chama.
 */
export function createMockSupabaseClient(user: MockUser | null = { id: "user-1" }) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  };
}
