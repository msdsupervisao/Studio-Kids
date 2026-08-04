# Studio Kids

Plataforma de video educacional para criancas (estilo YouTube), Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage). Professores publicam aulas em video, alunos assistem e interagem.

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

- `git push origin main` -> deploy automatico Vercel, sem downtime (build+swap atomico). Producao: `https://studio-kids-seven.vercel.app`.
- Dashboard as vezes mostra "Building" desatualizado — confirmar na pagina do deployment ou testando a URL direto.

## Arquivos que nunca devem ser abertos por inteiro

- `package-lock.json` (9k+ linhas) — consultar versao de dependencia via `package.json`, nunca ler o lockfile inteiro.
