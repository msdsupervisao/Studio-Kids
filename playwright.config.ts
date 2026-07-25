import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * O e2e roda contra o projeto Supabase real (nao ha ambiente de teste
 * separado) — ver CLAUDE.md. Por isso exige as mesmas env vars do
 * `.env.local` e e pulado (ver e2e/helpers/test-account.ts) quando
 * SUPABASE_SERVICE_ROLE_KEY nao esta disponivel, em vez de falhar.
 *
 * O `next dev` (webServer abaixo) carrega .env.local sozinho, mas o
 * processo do Playwright em si nao — sem dotenv como dependencia, le e
 * aplica manualmente aqui para as chamadas REST em e2e/helpers.
 */
function loadDotEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    const key = match?.[1];
    const rawValue = match?.[2];
    if (!key || rawValue === undefined || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
loadDotEnvLocal();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "list",
  // beforeAll/afterAll usam esse timeout (test.setTimeout no corpo do teste
  // so cobre o teste em si) — com varias chamadas REST sequenciais no
  // cleanup contra o Supabase real, 60s por hook e curto demais.
  timeout: 120_000,
  // Contra o Supabase real (sem ambiente de teste dedicado), auth/signup
  // pode responder bem mais devagar que os 5s padrao do Playwright,
  // sobretudo em execucoes seguidas — o form fica em "Criando conta..."
  // pendente, nao e erro. 15s da folga sem mascarar uma falha de verdade.
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
