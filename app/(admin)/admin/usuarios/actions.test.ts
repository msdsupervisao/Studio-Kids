import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, queryResult } from "@/test/supabase-mock";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/supabase/server", () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

const { createClient, createServiceRoleClient } = await import("@/services/supabase/server");
const { updateUserRole, deleteUser, resetUserPassword } = await import("./actions");

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

    const result = await updateUserRole(OTHER_USER_ID, "professor");

    expect(result).toEqual({});
    expect(update).toHaveBeenCalledWith({ role: "professor" });
  });

  it("propaga erro do banco", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.from.mockReturnValueOnce(queryResult({ error: { message: "falhou" } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await updateUserRole(OTHER_USER_ID, "professor");

    expect(result.error).toContain("Falha ao atualizar papel do usuário");
  });
});

describe("deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recusa quando ninguém está logado", async () => {
    const client = createMockSupabaseClient(null);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await deleteUser(OTHER_USER_ID, "senha123");

    expect(result.error).toContain("Sessão expirada");
  });

  it("recusa remover a própria conta", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await deleteUser("admin-1", "senha123");

    expect(result.error).toContain("não pode remover sua própria conta");
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("recusa quando quem chama não é admin", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: false, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await deleteUser(OTHER_USER_ID, "senha123");

    expect(result.error).toContain("Apenas administradores podem remover contas");
  });

  it("recusa sem senha de confirmação", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await deleteUser(OTHER_USER_ID, "");

    expect(result.error).toContain("Digite sua senha");
  });

  it("recusa quando a senha de confirmação está incorreta", async () => {
    const client = createMockSupabaseClient({ id: "admin-1", email: "admin@contas.studiokids.internal" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    client.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: "invalid" } });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await deleteUser(OTHER_USER_ID, "senha-errada");

    expect(result.error).toContain("Senha incorreta");
  });

  it("apaga a conta via service role quando autorizado", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const deleteUserAdmin = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.mocked(createServiceRoleClient).mockReturnValue({
      auth: { admin: { deleteUser: deleteUserAdmin } },
    } as never);

    const result = await deleteUser(OTHER_USER_ID, "senha123");

    expect(result).toEqual({});
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

    const result = await deleteUser(OTHER_USER_ID, "senha123");

    expect(result.error).toContain("Falha ao remover conta");
  });
});

describe("resetUserPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recusa quando ninguém está logado", async () => {
    const client = createMockSupabaseClient(null);
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await resetUserPassword(OTHER_USER_ID, "SenhaNova1", "senha123");

    expect(result.error).toContain("Sessão expirada");
  });

  it("recusa quando quem chama não é admin", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: false, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await resetUserPassword(OTHER_USER_ID, "SenhaNova1", "senha123");

    expect(result.error).toContain("Apenas administradores podem redefinir senhas");
  });

  it("recusa senha nova fraca", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await resetUserPassword(OTHER_USER_ID, "curta", "senha123");

    expect(result.error).toContain("Mínimo de 8 caracteres");
  });

  it("recusa quando a senha do admin está incorreta", async () => {
    const client = createMockSupabaseClient({ id: "admin-1", email: "admin@contas.studiokids.internal" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    client.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: "invalid" } });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await resetUserPassword(OTHER_USER_ID, "SenhaNova1", "senha-errada");

    expect(result.error).toContain("Senha incorreta");
  });

  it("redefine a senha via service role quando autorizado", async () => {
    const client = createMockSupabaseClient({ id: "admin-1", email: "admin@contas.studiokids.internal" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const updateUserById = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.mocked(createServiceRoleClient).mockReturnValue({
      auth: { admin: { updateUserById } },
    } as never);

    const result = await resetUserPassword(OTHER_USER_ID, "SenhaNova1", "senha123");

    expect(result).toEqual({});
    expect(updateUserById).toHaveBeenCalledWith(OTHER_USER_ID, { password: "SenhaNova1" });
  });

  it("propaga erro da Admin API", async () => {
    const client = createMockSupabaseClient({ id: "admin-1", email: "admin@contas.studiokids.internal" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    const updateUserById = vi.fn().mockResolvedValue({ data: null, error: { message: "falhou" } });
    vi.mocked(createServiceRoleClient).mockReturnValue({
      auth: { admin: { updateUserById } },
    } as never);

    const result = await resetUserPassword(OTHER_USER_ID, "SenhaNova1", "senha123");

    expect(result.error).toContain("Falha ao redefinir senha");
  });
});
