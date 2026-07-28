import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStorageService } from "./storage.service";
import { STORAGE_BUCKETS } from "@/lib/constants";

function makeFile(sizeBytes: number, name = "video.mp4", type = "video/mp4"): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function makeSupabaseWithSignedUrl(
  signedUrl = "https://project.supabase.co/storage/v1/object/upload/sign/videos/x.mp4?token=abc"
) {
  return {
    storage: {
      from: vi.fn().mockReturnValue({
        createSignedUploadUrl: vi.fn().mockResolvedValue({
          data: { signedUrl, token: "abc", path: "x.mp4" },
          error: null,
        }),
        upload: vi.fn(),
      }),
    },
  };
}

type FakeProgressEvent = { lengthComputable: boolean; loaded: number; total: number };

class FakeXHR {
  static instances: FakeXHR[] = [];
  method = "";
  url = "";
  headers: Record<string, string> = {};
  status = 0;
  upload: { onprogress: ((event: FakeProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  aborted = false;
  sentBody: unknown = null;

  constructor() {
    FakeXHR.instances.push(this);
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }
  send(body: unknown) {
    this.sentBody = body;
  }
  abort() {
    this.aborted = true;
    this.onabort?.();
  }
}

beforeEach(() => {
  FakeXHR.instances = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("uploadWithProgress", () => {
  it("envia via XMLHttpRequest, reporta progresso real e resolve o path", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXHR as unknown as typeof XMLHttpRequest);
    const supabase = makeSupabaseWithSignedUrl();
    const storage = createStorageService(supabase as never);
    const file = makeFile(1000);
    const updates: number[] = [];

    const promise = storage.uploadWithProgress(STORAGE_BUCKETS.videos, "x.mp4", file, (fraction) =>
      updates.push(fraction)
    );
    await Promise.resolve();
    await Promise.resolve();

    const xhr = FakeXHR.instances.at(-1) as FakeXHR;
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 500, total: 1000 });
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 1000, total: 1000 });
    xhr.status = 200;
    xhr.onload?.();

    await expect(promise).resolves.toBe("x.mp4");
    expect(updates).toEqual([0.5, 1]);
    expect(xhr.method).toBe("PUT");
    expect(xhr.url).toContain("token=abc");
    expect(xhr.sentBody).toBe(file);
  });

  it("nao aborta enquanto o progresso continua chegando antes da janela de travamento", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("XMLHttpRequest", FakeXHR as unknown as typeof XMLHttpRequest);
    const supabase = makeSupabaseWithSignedUrl();
    const storage = createStorageService(supabase as never);
    const file = makeFile(2000);

    const promise = storage.uploadWithProgress(STORAGE_BUCKETS.videos, "x.mp4", file);
    await Promise.resolve();
    await Promise.resolve();
    const xhr = FakeXHR.instances.at(-1) as FakeXHR;

    await vi.advanceTimersByTimeAsync(40_000);
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 1000, total: 2000 });
    await vi.advanceTimersByTimeAsync(40_000);
    expect(xhr.aborted).toBe(false);
    xhr.status = 200;
    xhr.onload?.();

    await expect(promise).resolves.toBe("x.mp4");
  });

  it("aborta e lança mensagem amigável quando fica sem nenhum avanço pela janela de travamento", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("XMLHttpRequest", FakeXHR as unknown as typeof XMLHttpRequest);
    const supabase = makeSupabaseWithSignedUrl();
    const storage = createStorageService(supabase as never);
    const file = makeFile(1000);

    const promise = storage.uploadWithProgress(STORAGE_BUCKETS.videos, "x.mp4", file);
    const assertion = expect(promise).rejects.toThrow("O envio ficou sem resposta");
    await vi.advanceTimersByTimeAsync(45_000);
    await assertion;

    const xhr = FakeXHR.instances.at(-1) as FakeXHR;
    expect(xhr.aborted).toBe(true);
  });

  it("propaga erro quando o PUT responde com status fora da faixa 2xx", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXHR as unknown as typeof XMLHttpRequest);
    const supabase = makeSupabaseWithSignedUrl();
    const storage = createStorageService(supabase as never);
    const file = makeFile(100);

    const promise = storage.uploadWithProgress(STORAGE_BUCKETS.videos, "x.mp4", file);
    await Promise.resolve();
    await Promise.resolve();
    const xhr = FakeXHR.instances.at(-1) as FakeXHR;
    xhr.status = 403;
    xhr.onload?.();

    await expect(promise).rejects.toThrow("Falha ao enviar arquivo");
  });

  it("lança erro quando falha ao preparar a URL assinada de upload", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXHR as unknown as typeof XMLHttpRequest);
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUploadUrl: vi.fn().mockResolvedValue({ data: null, error: { message: "sem permissão" } }),
        }),
      },
    };
    const storage = createStorageService(supabase as never);
    const file = makeFile(100);

    await expect(storage.uploadWithProgress(STORAGE_BUCKETS.videos, "x.mp4", file)).rejects.toThrow(
      "Falha ao preparar envio"
    );
  });

  it("cai de volta em upload() sem XMLHttpRequest (contexto de servidor)", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUploadUrl: vi.fn(),
          upload: uploadMock,
        }),
      },
    };
    const storage = createStorageService(supabase as never);
    const file = makeFile(100);

    const result = await storage.uploadWithProgress(STORAGE_BUCKETS.videos, "x.mp4", file);

    expect(result).toBe("x.mp4");
    expect(uploadMock).toHaveBeenCalled();
  });
});
