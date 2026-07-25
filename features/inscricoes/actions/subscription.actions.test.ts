import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, queryResult } from "@/test/supabase-mock";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/supabase/server", () => ({ createClient: vi.fn() }));

const { createClient } = await import("@/services/supabase/server");
const { toggleSubscription } = await import("@/features/inscricoes/actions/subscription.actions");

describe("toggleSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recusa quando ninguém está logado", async () => {
    const client = createMockSupabaseClient(null);
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(toggleSubscription("channel-1", "canal-teste")).rejects.toThrow("Faca login para se inscrever");
  });

  it("cria a inscrição quando o usuário ainda não está inscrito", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.from
      .mockReturnValueOnce(queryResult({ data: null })) // select existente
      .mockReturnValueOnce(queryResult({ error: null })); // insert
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await toggleSubscription("channel-1", "canal-teste");

    expect(result).toEqual({ subscribed: true });
    expect(client.from).toHaveBeenNthCalledWith(2, "subscriptions");
  });

  it("cancela a inscrição quando o usuário já está inscrito", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.from
      .mockReturnValueOnce(queryResult({ data: { channel_id: "channel-1" } })) // select existente
      .mockReturnValueOnce(queryResult({ error: null })); // delete
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await toggleSubscription("channel-1", "canal-teste");

    expect(result).toEqual({ subscribed: false });
  });

  it("propaga erro do banco ao tentar se inscrever", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.from
      .mockReturnValueOnce(queryResult({ data: null }))
      .mockReturnValueOnce(queryResult({ error: { message: "constraint violada" } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(toggleSubscription("channel-1", "canal-teste")).rejects.toThrow("Falha ao se inscrever");
  });

  it("propaga erro do banco ao tentar cancelar a inscrição", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.from
      .mockReturnValueOnce(queryResult({ data: { channel_id: "channel-1" } }))
      .mockReturnValueOnce(queryResult({ error: { message: "timeout" } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(toggleSubscription("channel-1", "canal-teste")).rejects.toThrow("Falha ao cancelar inscricao");
  });
});
