import { describe, expect, it } from "vitest";
import { sanitizeMultilineText, sanitizePlainText } from "@/utils/sanitize";

describe("sanitizePlainText", () => {
  it("colapsa espaços redundantes e apara as bordas", () => {
    expect(sanitizePlainText("  ola   mundo  ")).toBe("ola mundo");
  });

  it("converte quebras de linha em espaço simples", () => {
    expect(sanitizePlainText("linha um\nlinha dois")).toBe("linha um linha dois");
  });

  it("remove zero-width space e outros caracteres invisíveis", () => {
    const withInvisible = `ola${String.fromCharCode(0x200b)}mundo`;
    expect(sanitizePlainText(withInvisible)).toBe("olamundo");
  });

  it("remove o BOM (zero-width no-break space)", () => {
    const withBom = `${String.fromCharCode(0xfeff)}titulo`;
    expect(sanitizePlainText(withBom)).toBe("titulo");
  });
});

describe("sanitizeMultilineText", () => {
  it("preserva quebras de linha mas apara espaços no fim de cada linha", () => {
    expect(sanitizeMultilineText("linha um   \nlinha dois\t\n")).toBe("linha um\nlinha dois");
  });

  it("colapsa espaços redundantes dentro de cada linha, sem juntar linhas", () => {
    expect(sanitizeMultilineText("a    b\nc    d")).toBe("a b\nc d");
  });

  it("remove caracteres invisíveis mantendo a estrutura de linhas", () => {
    const withInvisible = `linha${String.fromCharCode(0x200c)}um\nlinha dois`;
    expect(sanitizeMultilineText(withInvisible)).toBe("linhaum\nlinha dois");
  });
});
