import { describe, expect, it } from "vitest";
import { slugify, slugifyWithSuffix } from "@/utils/slug";

describe("slugify", () => {
  it("remove acentos e pontuação, troca espaços por hífen", () => {
    expect(slugify("Introdução a React Hooks!")).toBe("introducao-a-react-hooks");
  });

  it("colapsa espaços múltiplos em um único hífen", () => {
    expect(slugify("canal   do   professor")).toBe("canal-do-professor");
  });

  it("remove underscore em vez de converter em hífen", () => {
    expect(slugify("professor_joao")).toBe("professorjoao");
  });

  it("remove hífens redundantes nas bordas", () => {
    expect(slugify("  -- ola mundo --  ")).toBe("ola-mundo");
  });

  it("lida com string vazia", () => {
    expect(slugify("")).toBe("");
  });
});

describe("slugifyWithSuffix", () => {
  it("anexa o sufixo em minúsculas separado por hífen", () => {
    expect(slugifyWithSuffix("Canal do Zé", "AB12")).toBe("canal-do-ze-ab12");
  });
});
