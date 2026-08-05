# Studio Kids

Plataforma de video educacional para criancas (estilo YouTube), Next.js 15 (App Router) + Supabase (Postgres, Auth) + Cloudflare R2 (storage de video/imagem). Professores publicam aulas em video, alunos assistem e interagem.

## Autonomia — proceda sem pedir confirmacao

Autorizacao permanente, valida em qualquer sessao: nao pergunte antes de agir.

- Commits, push, scripts, correcoes, contas de teste, monitorar deploy: faca direto.
- Decisao ambigua/subjetiva: escolha a opcao mais provavel, implemente, informe o que e por que decidiu — nao pare para perguntar. So pergunte de verdade quando as opcoes forem equivalentes em custo/risco e o erro for caro de desfazer.
- Sempre reporte o que foi feito ao final.
- Cautela normal permanece para acoes destrutivas/dificeis de reverter (apagar dados de producao, force-push, resets) — avisar antes nesses casos raros.

**Bloqueio estrutural, nao contornavel por instrucao:** senha/pagamento, OAuth/SSO, compras/transferencias, exclusao permanente de dados, mensagem a terceiros em nome do usuario — regra de sistema, nao deste projeto.

## Banco de dados (Supabase)

- Sem CLI/token conectado nesta maquina — migrations em `supabase/migrations/`, dono aplica manualmente no SQL Editor (projeto `hhdejsiehztxwtqejete`); sempre fornecer o SQL pronto.
- `supabase/policies/rls.sql` = estado canonico de todas as RLS policies/funcoes `security definer` — manter sincronizado com as migrations numeradas.
- RLS: nunca policy consultando a propria tabela em subquery direta (erro 42P17, recursao infinita) — usar funcao `security definer` (ver `is_admin`, `owns_channel`, `comment_parent_in_video`).
- `SUPABASE_SERVICE_ROLE_KEY` (`.env.local`): so para criar/apagar contas de teste via REST (`/auth/v1/admin/users`) — nunca para testar a app (bypassa RLS).

## Storage (Cloudflare R2)

- Arquivos binarios (video, thumbnail, avatar, banner, post-image) moraram no Supabase Storage e migraram pro Cloudflare R2 (2026-08) — motivo: R2 nao cobra egress, Supabase Storage fica caro em volume de video. Banco (Postgres) e Auth continuam no Supabase, sem mudanca. Deploy do app continua no Vercel, sem mudanca — a migracao foi so do storage, nao "tudo pra um servidor novo".
- Bucket unico no R2, com o "bucket" logico (videos/thumbnails/avatars/banners/post-images) como prefixo da chave — ver `services/storage/r2.ts`.
- `STORAGE_PROVIDER` (env var) escolhe o provedor ativo; `services/storage/storage.service.ts` despacha pra R2 ou Supabase — trocar de provedor e so mudar a env var, nenhuma feature muda.
- R2 nao tem RLS como o Supabase Storage — `storage.actions.ts` checa login manualmente (`requireLoggedInUser`) antes de gerar URL assinada de upload ou apagar objeto.
- Upload vai direto do navegador pro R2 via URL assinada (PUT, expira em 10min) — nao passa pelo servidor Next.js. Por isso falha de upload NAO aparece nos logs do Vercel; so no network tab do navegador, ou testando a URL assinada direto (curl PUT). Pra diagnosticar upload quebrado, testar pela UI real (conta descartavel, ver secao abaixo), nao so ler logs do servidor.
- `MAINTENANCE_MODE` (env var) liga uma tela de manutencao via middleware, sem precisar de deploy — usado durante a migracao de storage.
- Scripts manuais de operacao em `scripts/` (inventario, migracao, CORS, backfill de miniatura, verificacao de tamanho) — leem credenciais do `.env.local`, rodar da raiz do projeto (precisam do `node_modules` daqui).

## Testando funcionalidades que exigem login

- Nunca reusar sessao real do usuario — criar conta descartavel via REST (`${username}@contas.studiokids.internal`), testar, apagar ao final.
- `npm run dev` cai na 3001 (3000 geralmente ocupada pelo usuario) — encerrar o processo ao terminar.
- Nunca digitar a senha real do usuario em nenhum campo, mesmo colada no chat — pedir para ele digitar.

## Testes automatizados

- `npm test` (Vitest): unit + integracao de Server Actions com Supabase mockado (`test/supabase-mock.ts`).
- `npm run test:e2e` (Playwright, `e2e/golden-path.spec.ts`): contra Supabase real, sobe o dev server na 3001; pulado sem `SUPABASE_SERVICE_ROLE_KEY`.
- Contas de teste do e2e seguem a mesma regra da secao acima (`e2e/helpers/test-account.ts`) — service role so faz bootstrap, a logica testada roda pela UI real.
- Promover a admin via SQL Editor esta quebrado (trigger de seguranca) — detalhes e workaround em `docs/archive/admin-promotion-trigger.md`.

## Deploy

- `git push origin main` -> deploy automatico Vercel, sem downtime (build+swap atomico). Producao: `https://studio-kids-seven.vercel.app`, na conta Vercel `supervisaomsdsorriso-6830` (login via navegador, nao via CLI local).
- Dashboard as vezes mostra "Building" desatualizado — confirmar na pagina do deployment ou testando a URL direto.
- **Cuidado com o Vercel CLI local**: ja aconteceu (2026-08-04) do `.vercel/project.json` local ficar linkado a um projeto vazio numa conta Vercel diferente da que hospeda a producao real — nenhum erro visivel, so um projeto fantasma sem deploy nem env vars. Antes de rodar `vercel env`/`vercel deploy`/`vercel link` por CLI nesta maquina, confirmar que a conta logada (`vercel whoami`) e o projeto linkado batem com a producao real — nunca assumir que o link local esta certo.

## Arquivos que nunca devem ser abertos por inteiro

- `package-lock.json` (9k+ linhas) — consultar versao de dependencia via `package.json`, nunca ler o lockfile inteiro.
