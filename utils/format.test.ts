import { describe, expect, it } from "vitest";
import { formatCompactNumber, formatDuration, formatLikes, formatRelativeDate, formatViews } from "@/utils/format";

// Intl usa espaço nao-quebravel (U+00A0) entre numero e unidade — monta a
// partir do code point para nao depender de um caractere invisivel no fonte.
const NBSP = String.fromCharCode(0xa0);

describe("formatDuration", () => {
  it("formata segundos abaixo de um minuto", () => {
    expect(formatDuration(5)).toBe("0:05");
  });

  it("formata minutos e segundos", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("formata horas, minutos e segundos", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("arredonda para baixo frações de segundo", () => {
    expect(formatDuration(59.9)).toBe("0:59");
  });
});

describe("formatCompactNumber", () => {
  it("mantém números pequenos como estão", () => {
    expect(formatCompactNumber(42)).toBe("42");
  });

  it("abrevia milhares em pt-BR", () => {
    expect(formatCompactNumber(1500)).toBe(`1,5${NBSP}mil`);
  });

  it("abrevia milhões em pt-BR", () => {
    expect(formatCompactNumber(2300000)).toBe(`2,3${NBSP}mi`);
  });
});

describe("formatViews", () => {
  it("usa singular para exatamente 1 visualização", () => {
    expect(formatViews(1)).toBe("1 visualizacao");
  });

  it("usa plural para 0 ou mais de 1 visualização", () => {
    expect(formatViews(0)).toBe("0 visualizacoes");
    expect(formatViews(2)).toBe("2 visualizacoes");
  });
});

describe("formatLikes", () => {
  it("usa singular para exatamente 1 curtida", () => {
    expect(formatLikes(1)).toBe("1 curtida");
  });

  it("usa plural para 0 ou mais de 1 curtida", () => {
    expect(formatLikes(0)).toBe("0 curtidas");
    expect(formatLikes(12)).toBe("12 curtidas");
  });
});

describe("formatRelativeDate", () => {
  // Usa 3 dias / 2 horas (nao 2 dias / 1 hora) para nao cair nos
  // idiomatismos que o Intl usa com numeric:"auto" (ex: "anteontem").
  it("formata uma data no passado em unidade de dias", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(threeDaysAgo)).toBe("há 3 dias");
  });

  it("formata uma data no futuro", () => {
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeDate(inTwoHours)).toBe("em 2 horas");
  });
});
