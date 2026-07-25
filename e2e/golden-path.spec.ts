import path from "node:path";
import { expect, test, type Browser } from "@playwright/test";
import {
  createDisposableAccount,
  deleteDisposableAccount,
  getUserIdByUsername,
  hasServiceRole,
  promoteToAdmin,
} from "./helpers/test-account";

const FIXTURE_VIDEO = path.resolve(__dirname, "fixtures/sample-video.mp4");

/**
 * Fluxo completo: cadastro (via UI) → criação de canal no onboarding →
 * upload de vídeo → aprovação (conta admin descartável, pré-criada) →
 * assistir. Roda contra o Supabase real do projeto — ver CLAUDE.md e
 * e2e/helpers/test-account.ts para a política de contas descartáveis.
 */
test.describe("cadastro → upload → aprovação → assistir", () => {
  test.skip(!hasServiceRole, "SUPABASE_SERVICE_ROLE_KEY não configurada — pulando e2e contra Supabase real");
  test.setTimeout(180_000);

  const runId = Date.now();
  const professorUsername = `sk_e2e_${runId}`;
  const professorPassword = "SenhaE2e123";
  const professorFullName = "Professor E2E";
  const channelName = `Canal E2E ${runId}`;
  const videoTitle = `Aula de teste automatizado ${runId}`;

  const adminUsername = `sk_e2e_admin_${runId}`;
  const adminPassword = "SenhaE2eAdmin123";

  let adminUserId: string;
  let professorUserId: string | null = null;
  let videoId: string | null = null;

  test.beforeAll(async () => {
    const admin = await createDisposableAccount({
      username: adminUsername,
      fullName: "Admin E2E",
      password: adminPassword,
    });
    adminUserId = admin.id;
    await promoteToAdmin(admin.id);
  });

  test.afterAll(async () => {
    if (adminUserId) await deleteDisposableAccount(adminUserId);
    if (!professorUserId) professorUserId = await getUserIdByUsername(professorUsername);
    if (professorUserId) await deleteDisposableAccount(professorUserId);
  });

  test("professor se cadastra, cria canal, envia vídeo; admin aprova; visitante assiste", async ({
    page,
    browser,
  }: {
    page: import("@playwright/test").Page;
    browser: Browser;
  }) => {
    await test.step("cadastro", async () => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Criar conta" }).click();
      await page.getByLabel("Nome completo").fill(professorFullName);
      await page.getByLabel("Nome de usuário").fill(professorUsername);
      // getByLabel("Senha") tambem bate no botao "Mostrar senha" (substring
      // case-insensitive) — usa o id do campo para ser inequivoco.
      await page.locator("#signup-password").fill(professorPassword);
      await page.locator("form").getByRole("button", { name: "Criar conta" }).click();
      await expect(page).toHaveURL(/\/primeiro-acesso/);
    });

    await test.step("cria canal no onboarding", async () => {
      const channelNameInput = page.getByLabel("Nome do canal");
      await channelNameInput.fill(channelName);
      await page.getByRole("button", { name: "Criar meu canal" }).click();
      await expect(page).toHaveURL(/\/inicio/);
    });

    await test.step("envia vídeo para análise", async () => {
      await page.goto("/upload");
      await page.locator('input[type="file"][accept*="video"]').setInputFiles(FIXTURE_VIDEO);
      await expect(page.getByText("sample-video.mp4")).toBeVisible();
      await page.getByLabel("Título").fill(videoTitle);
      await page.getByLabel("Descrição").fill("Vídeo gerado automaticamente pelo teste e2e.");

      await page.getByRole("button", { name: /Enviar para análise/ }).click();
      await expect(page).toHaveURL(/\/professor\/videos/, { timeout: 60_000 });

      const videoLink = page.locator('a[href^="/video/"]').filter({ hasText: videoTitle }).first();
      await expect(videoLink).toBeVisible();
      const href = await videoLink.getAttribute("href");
      videoId = href?.split("/video/")[1] ?? null;
      expect(videoId).toBeTruthy();
    });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    try {
      await test.step("admin aprova o vídeo", async () => {
        await adminPage.goto("/login");
        await adminPage.getByLabel("Usuário ou e-mail").fill(adminUsername);
        await adminPage.locator("#password").fill(adminPassword);
        // A aba "Entrar" e o botao de submit tem o mesmo texto quando o
        // formulario abre no modo login — escopar ao <form> evita ambiguidade.
        await adminPage.locator("form").getByRole("button", { name: "Entrar" }).click();
        await expect(adminPage).toHaveURL(/\/inicio/);

        await adminPage.goto("/admin/uploads");
        const row = adminPage.locator("li").filter({ hasText: videoTitle });
        await expect(row).toBeVisible();
        await row.getByRole("button", { name: "Aprovar" }).click();
        await expect(adminPage.getByText("Vídeo aprovado e publicado")).toBeVisible();
      });
    } finally {
      await adminContext.close();
    }

    // Nao ha visita anonima aqui: o middleware exige login em toda rota
    // exceto /login e /esqueci-senha (ver CHECKLIST.md — SEO/acesso publico
    // ficou fora do escopo do MVU). Reusa a sessao do proprio professor
    // para confirmar que o video ficou assistivel apos a aprovacao.
    await test.step("assiste ao vídeo após a aprovação", async () => {
      await page.goto(`/video/${videoId}`);
      await expect(page.getByRole("heading", { name: videoTitle })).toBeVisible();
      await expect(page.locator(`video[aria-label="${videoTitle}"]`)).toBeAttached();
      // So aparece campo de comentario quando o video esta com status
      // "published" — prova indireta de que a moderacao realmente mudou o
      // estado, e nao so que a pagina carrega para o dono do video.
      await expect(page.getByPlaceholder("Adicione um comentário...")).toBeVisible();
    });
  });
});
