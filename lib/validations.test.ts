import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  channelSchema,
  commentSchema,
  loginSchema,
  signupSchema,
  usernameSchema,
  videoModerationSchema,
} from "@/lib/validations";

describe("usernameSchema", () => {
  it("aceita letras minúsculas, números, ponto e underline", () => {
    expect(usernameSchema.safeParse("joao_silva.2").success).toBe(true);
  });

  it("rejeita maiúsculas", () => {
    expect(usernameSchema.safeParse("JoaoSilva").success).toBe(false);
  });

  it("rejeita menos de 3 caracteres", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
  });

  it("rejeita caracteres especiais como @", () => {
    expect(usernameSchema.safeParse("joao@silva").success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = { fullName: "Maria Silva", username: "maria_silva", password: "Senha1234" };

  it("aceita dados válidos", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("exige ao menos uma letra maiúscula na senha", () => {
    const result = signupSchema.safeParse({ ...valid, password: "senha1234" });
    expect(result.success).toBe(false);
  });

  it("exige ao menos um número na senha", () => {
    const result = signupSchema.safeParse({ ...valid, password: "SenhaSenha" });
    expect(result.success).toBe(false);
  });

  it("exige mínimo de 8 caracteres na senha", () => {
    const result = signupSchema.safeParse({ ...valid, password: "Sen1" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita identifier como nome de usuário", () => {
    expect(loginSchema.safeParse({ identifier: "joao_silva", password: "x" }).success).toBe(true);
  });

  it("aceita identifier como e-mail (contas antigas)", () => {
    expect(loginSchema.safeParse({ identifier: "joao@example.com", password: "x" }).success).toBe(true);
  });

  it("rejeita identifier vazio", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "x" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("aceita quando as senhas coincidem", () => {
    const result = changePasswordSchema.safeParse({ password: "Senha1234", confirmPassword: "Senha1234" });
    expect(result.success).toBe(true);
  });

  it("rejeita quando as senhas não coincidem", () => {
    const result = changePasswordSchema.safeParse({ password: "Senha1234", confirmPassword: "Outra1234" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});

describe("channelSchema", () => {
  it("aceita nome e slug válidos", () => {
    const result = channelSchema.safeParse({ name: "Canal de Robótica", slug: "canal-robotica" });
    expect(result.success).toBe(true);
  });

  it("rejeita slug com maiúsculas ou espaços", () => {
    expect(channelSchema.safeParse({ name: "Canal", slug: "Canal Robotica" }).success).toBe(false);
  });

  it("rejeita slug com menos de 3 caracteres", () => {
    expect(channelSchema.safeParse({ name: "Canal", slug: "ab" }).success).toBe(false);
  });
});

describe("commentSchema", () => {
  const videoId = "550e8400-e29b-41d4-a716-446655440000";

  it("aceita conteúdo não vazio com videoId válido", () => {
    expect(commentSchema.safeParse({ videoId, content: "Ótima aula!" }).success).toBe(true);
  });

  it("rejeita conteúdo vazio", () => {
    expect(commentSchema.safeParse({ videoId, content: "" }).success).toBe(false);
  });

  it("rejeita videoId que não é UUID", () => {
    expect(commentSchema.safeParse({ videoId: "não-e-uuid", content: "oi" }).success).toBe(false);
  });
});

describe("videoModerationSchema", () => {
  const videoId = "550e8400-e29b-41d4-a716-446655440000";

  it("aceita status published sem motivo de rejeição", () => {
    expect(videoModerationSchema.safeParse({ videoId, status: "published" }).success).toBe(true);
  });

  it("aceita status rejected com motivo", () => {
    const result = videoModerationSchema.safeParse({
      videoId,
      status: "rejected",
      rejectionReason: "Áudio inaudível",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita status fora do enum", () => {
    expect(videoModerationSchema.safeParse({ videoId, status: "pending" }).success).toBe(false);
  });
});
