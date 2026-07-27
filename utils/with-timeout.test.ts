import { describe, expect, it, vi } from "vitest";
import { withTimeout } from "@/utils/with-timeout";

describe("withTimeout", () => {
  it("resolve com o valor da promise quando ela termina antes do prazo", async () => {
    vi.useFakeTimers();
    const promise = withTimeout(Promise.resolve("ok"), 1000, "estourou o prazo");
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    vi.useRealTimers();
  });

  it("rejeita com o erro original quando a promise rejeita antes do prazo", async () => {
    // Timers reais aqui — o que importa e so a propagacao da rejeicao, nao o
    // prazo, e misturar fake timers com uma rejeicao real e fonte de
    // "unhandled rejection" falso-positivo por causa da ordem de microtasks.
    const promise = withTimeout(Promise.reject(new Error("falhou")), 10_000, "estourou o prazo");
    await expect(promise).rejects.toThrow("falhou");
  });

  it("rejeita com a mensagem de timeout quando a promise nunca resolve", async () => {
    vi.useFakeTimers();
    const neverSettles = new Promise(() => {});
    const promise = withTimeout(neverSettles, 1000, "estourou o prazo");
    const assertion = expect(promise).rejects.toThrow("estourou o prazo");
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    vi.useRealTimers();
  });
});
