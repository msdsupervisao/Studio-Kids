import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabaseClient, queryResult } from "@/test/supabase-mock";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/services/supabase/server", () => ({ createClient: vi.fn() }));

const { createClient } = await import("@/services/supabase/server");
const { createDraftVideo, finalizeVideoUpload, updateVideoStatus } = await import(
  "@/features/video/actions/video.actions"
);

const CHANNEL_ID = "550e8400-e29b-41d4-a716-446655440000";
const VIDEO_ID = "660e8400-e29b-41d4-a716-446655440001";

const validDraft = {
  channelId: CHANNEL_ID,
  title: "Introdução a Frações",
  description: "Uma aula sobre frações.",
  categoryId: null as string | null,
  durationSeconds: 120,
};

describe("createDraftVideo (upload)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita título curto antes de tocar no banco", async () => {
    await expect(createDraftVideo({ ...validDraft, title: "ab" })).rejects.toThrow("Mínimo de 3 caracteres");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("recusa quando ninguém está logado", async () => {
    const client = createMockSupabaseClient(null);
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(createDraftVideo(validDraft)).rejects.toThrow("Sessão expirada");
  });

  it("cria o rascunho e retorna o id do vídeo", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.from
      .mockReturnValueOnce(queryResult({ data: null })) // checagem de rascunho abandonado: nenhum
      .mockReturnValueOnce(queryResult({ data: { id: VIDEO_ID } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await createDraftVideo(validDraft);

    expect(result).toEqual({ videoId: VIDEO_ID });
    expect(client.from).toHaveBeenCalledWith("videos");
  });

  it("apaga rascunho abandonado (sem arquivo) com o mesmo slug antes de inserir", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    const deleteFn = vi.fn().mockReturnValue(queryResult({ error: null }));
    client.from
      .mockReturnValueOnce(queryResult({ data: { id: "stale-draft-id" } })) // rascunho abandonado encontrado
      .mockReturnValueOnce({ delete: deleteFn } as never)
      .mockReturnValueOnce(queryResult({ data: { id: VIDEO_ID } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await createDraftVideo(validDraft);

    expect(result).toEqual({ videoId: VIDEO_ID });
    expect(deleteFn).toHaveBeenCalled();
  });

  it("sanitiza título/descrição e grava status pending", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    const insert = vi.fn().mockReturnValue(queryResult({ data: { id: VIDEO_ID } }));
    client.from
      .mockReturnValueOnce(queryResult({ data: null }))
      .mockReturnValueOnce({ insert } as never);
    vi.mocked(createClient).mockResolvedValue(client as never);

    await createDraftVideo({ ...validDraft, title: "  Introdução   a Frações  " });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Introdução a Frações",
        status: "pending",
        channel_id: CHANNEL_ID,
      })
    );
  });

  it("propaga erro do banco ao inserir", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.from
      .mockReturnValueOnce(queryResult({ data: null }))
      .mockReturnValueOnce(queryResult({ data: null, error: { message: "coluna inválida" } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(createDraftVideo(validDraft)).rejects.toThrow("Falha ao criar vídeo");
  });

  it("desambigua o slug quando colide com um vídeo de verdade (com arquivo)", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    const firstInsert = vi
      .fn()
      .mockReturnValue(queryResult({ data: null, error: { message: "duplicate key", code: "23505" } }));
    const secondInsert = vi.fn().mockReturnValue(queryResult({ data: { id: VIDEO_ID } }));
    client.from
      .mockReturnValueOnce(queryResult({ data: null })) // checagem de rascunho abandonado: nenhum
      .mockReturnValueOnce({ insert: firstInsert } as never) // 1a tentativa: colide (23505)
      .mockReturnValueOnce({ insert: secondInsert } as never); // 2a tentativa: slug desambiguado
    vi.mocked(createClient).mockResolvedValue(client as never);

    const result = await createDraftVideo(validDraft);

    expect(result).toEqual({ videoId: VIDEO_ID });
    expect(firstInsert).toHaveBeenCalledTimes(1);
    expect(secondInsert).toHaveBeenCalledTimes(1);
  });
});

describe("finalizeVideoUpload (upload)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita um videoId que não é UUID", async () => {
    await expect(finalizeVideoUpload("not-a-uuid", "path.mp4", null)).rejects.toThrow("Dados de upload inválidos");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejeita videoPath vazio", async () => {
    await expect(finalizeVideoUpload(VIDEO_ID, "", null)).rejects.toThrow("Dados de upload inválidos");
  });

  it("grava os paths finais do vídeo e da miniatura", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.from.mockReturnValueOnce(queryResult({ error: null }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(finalizeVideoUpload(VIDEO_ID, "chan/video.mp4", "chan/thumb.jpg")).resolves.toBeUndefined();
    expect(client.from).toHaveBeenCalledWith("videos");
  });

  it("propaga erro do banco ao finalizar", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.from.mockReturnValueOnce(queryResult({ error: { message: "linha não encontrada" } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(finalizeVideoUpload(VIDEO_ID, "chan/video.mp4", null)).rejects.toThrow("Falha ao finalizar upload");
  });
});

describe("updateVideoStatus (moderação)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejeita um videoId que não é UUID", async () => {
    await expect(updateVideoStatus("not-a-uuid", "published")).rejects.toThrow("Invalid uuid");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("recusa quando ninguém está logado", async () => {
    const client = createMockSupabaseClient(null);
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(updateVideoStatus(VIDEO_ID, "published")).rejects.toThrow("Sessão expirada");
  });

  it("recusa quando o usuário logado não é admin", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.rpc.mockResolvedValue({ data: false, error: null });
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(updateVideoStatus(VIDEO_ID, "published")).rejects.toThrow(
      "Apenas administradores podem moderar vídeos."
    );
  });

  it("recusa quando a checagem de admin falha", async () => {
    const client = createMockSupabaseClient({ id: "user-1" });
    client.rpc.mockResolvedValue({ data: null, error: { message: "rpc indisponível" } });
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(updateVideoStatus(VIDEO_ID, "published")).rejects.toThrow(
      "Apenas administradores podem moderar vídeos."
    );
  });

  it("recusa publicar um vídeo sem arquivo enviado (upload incompleto)", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    client.from.mockReturnValueOnce(queryResult({ data: { video_path: "" } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(updateVideoStatus(VIDEO_ID, "published")).rejects.toThrow("upload incompleto");
  });

  it("aprova o vídeo (define published_at, limpa rejection_reason)", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    const update = vi.fn().mockReturnValue(queryResult({ error: null }));
    client.from
      .mockReturnValueOnce(queryResult({ data: { video_path: "chan/video.mp4" } }))
      .mockReturnValueOnce({ update } as never);
    vi.mocked(createClient).mockResolvedValue(client as never);

    await updateVideoStatus(VIDEO_ID, "published");

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "published", rejection_reason: null, published_at: expect.any(String) })
    );
  });

  it("rejeita o vídeo com o motivo informado", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    const update = vi.fn().mockReturnValue(queryResult({ error: null }));
    client.from.mockReturnValueOnce({ update } as never);
    vi.mocked(createClient).mockResolvedValue(client as never);

    await updateVideoStatus(VIDEO_ID, "rejected", "Áudio inaudível");

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "rejected", rejection_reason: "Áudio inaudível", published_at: null })
    );
  });

  it("propaga erro do banco ao atualizar status", async () => {
    const client = createMockSupabaseClient({ id: "admin-1" });
    client.rpc.mockResolvedValue({ data: true, error: null });
    client.from
      .mockReturnValueOnce(queryResult({ data: { video_path: "chan/video.mp4" } }))
      .mockReturnValueOnce(queryResult({ error: { message: "linha bloqueada" } }));
    vi.mocked(createClient).mockResolvedValue(client as never);

    await expect(updateVideoStatus(VIDEO_ID, "published")).rejects.toThrow("Falha ao atualizar status do vídeo");
  });
});
