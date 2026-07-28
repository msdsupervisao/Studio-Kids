import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, queryResult } from "@/test/supabase-mock";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/supabase/server", () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

const { createClient, createServiceRoleClient } = await import("@/services/supabase/server");
const { updateUserRole, deleteUser } = await import("./actions");

const OTHER_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("updateUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("atualiza o papel do usuário", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    const update = vi.fn().mockReturnValue(queryResult({ error: null }));
    client.from.mockReturnValueOnce({ update });
    vi.mocked(createClient).mockResolvedValue(client as never);

    await updateUserRole(OTHER_USER_ID, "professor");

    expect(update).toHaveBeenCalledWith({ role: "professor" });
  });

  it("propaga erro do banco", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.from.mockReturnValueOnce(queryResult({ error: { message: "falhou" } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(updateUserRole(OTHER_USER_ID, "professor")).rejects.toThrow(
      "Falha ao atualizar papel do usuário"
    );
  });
});

describe("deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recusa quando ninguém está logado", async () => {
    const client = createMockSupabaseClient(null);
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(deleteUser(OTHER_USER_ID)).rejects.toThrow("Sessão expirada");
  });

  it("recusa remover a própria conta", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(deleteUser("admin-1")).rejects.toThrow("não pode remover sua própria conta");
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("recusa quando quem chama não é admin", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: false, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(deleteUser(OTHER_USER_ID)).rejects.toThrow("Apenas administradores podem remover contas");
  });

  it("apaga a conta via service role quando autorizado", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const deleteUserAdmin = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.mocked(createServiceRoleClient).mockReturnValue({
      auth: { admin: { deleteUser: deleteUserAdmin } },
    } as never);

    await deleteUser(OTHER_USER_ID);

    expect(deleteUserAdmin).toHaveBeenCalledWith(OTHER_USER_ID);
  });

  it("propaga erro da Admin API", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const deleteUserAdmin = vi.fn().mockResolvedValue({ data: null, error: { message: "falhou" } });
    vi.mocked(createServiceRoleClient).mockReturnValue({
      auth: { admin: { deleteUser: deleteUserAdmin } },
    } as never);

    await expect(deleteUser(OTHER_USER_ID)).rejects.toThrow("Falha ao remover conta");
  });
});
