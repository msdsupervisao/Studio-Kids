import { describe, expect, it, vi } from "vitest";
import { queryResult } from "@/test/supabase-mock";
import { getLikesCountMap, toVideoCardData, type VideoCardRow } from "@/features/video/lib/video-card.mapper";

describe("getLikesCountMap", () => {
  it("retorna mapa vazio sem consultar o banco quando não há vídeos", async () => {
    const from = vi.fn();
    const result = await getLikesCountMap({ from } as never, []);

    expect(result.size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });

  it("conta curtidas por vídeo a partir de uma única query agrupada", async () => {
    const from = vi.fn().mockReturnValue(
      queryResult({
        data: [{ video_id: "v1" }, { video_id: "v1" }, { video_id: "v2" }],
      })
    );

    const result = await getLikesCountMap({ from } as never, ["v1", "v2", "v3"]);

    expect(result.get("v1")).toBe(2);
    expect(result.get("v2")).toBe(1);
    expect(result.get("v3")).toBeUndefined();
    expect(from).toHaveBeenCalledWith("video_reactions");
  });

  it("propaga erro do banco", async () => {
    const from = vi.fn().mockReturnValue(queryResult({ data: null, error: { message: "timeout" } }));

    await expect(getLikesCountMap({ from } as never, ["v1"])).rejects.toThrow("Falha ao carregar curtidas");
  });
});

describe("toVideoCardData", () => {
  const row: VideoCardRow = {
    id: "v1",
    slug: "aula-1",
    title: "Aula 1",
    thumbnail_path: "thumb.jpg",
    duration_seconds: 120,
    views_count: 10,
    published_at: "2026-01-01T00:00:00.000Z",
    channel: { slug: "canal", name: "Canal", avatar_url: "avatar.jpg" },
  };
  const identity = (path: string | null) => path;

  it("usa 0 como padrão quando likesCount não é informado", () => {
    expect(toVideoCardData(row, identity, identity).likesCount).toBe(0);
  });

  it("usa o valor de likesCount informado", () => {
    expect(toVideoCardData(row, identity, identity, 7).likesCount).toBe(7);
  });
});
