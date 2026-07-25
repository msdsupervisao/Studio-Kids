# Studio Kids

Plataforma de video educacional para criancas (estilo YouTube), construida com Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage). Professores publicam aulas em video, alunos assistem e interagem (comentarios, curtidas, playlists, inscricoes, "ver mais tarde").

## Autonomia — proceda sem pedir confirmacao

O dono deste projeto ja autorizou expressamente: **nao pergunte antes de agir**. Isso vale para qualquer sessao, nao so a que originou essa instrucao.

- Commits, push, rodar scripts, aplicar correcoes, criar/editar arquivos, testar com contas descartaveis, monitorar deploys: faca direto, sem perguntar "posso continuar?".
- **Decisoes ambiguas ou subjetivas (qual imagem usar, qual texto soa melhor, qual dos dois jeitos implementar)**: escolha a opcao mais provavel com seu melhor julgamento, implemente, e informe o que foi decidido e por que. Nao pare o trabalho com uma pergunta de multipla escolha para isso — deixe o usuario corrigir depois se a escolha nao for a ideal. So faca uma pergunta de verdade quando as opcoes forem realmente equivalentes em custo/risco e a escolha errada for cara de desfazer.
- Ainda assim, sempre reporte de forma clara o que foi feito ao final — autonomia nao e ausencia de transparencia.
- Continue tendo cautela normal com acoes genuinamente destrutivas ou dificeis de reverter (ex: apagar dados de producao, force-push, resets). Nesses casos raros, um aviso rapido antes de agir ainda vale a pena.

**Limite estrutural (nao contorna com instrucao):** algumas acoes ficam sempre bloqueadas por regra de sistema, independente de qualquer autorizacao do usuario ou deste arquivo — digitar senhas/dados de pagamento, autorizar OAuth/SSO, compras e transferencias, exclusao permanente de dados, mandar mensagem a terceiros em nome do usuario. Isso e proposital (protecao contra manipulacao via conteudo malicioso lido de paginas/arquivos) e nao e uma limitacao deste projeto especificamente.

## Banco de dados (Supabase)

- Nao ha CLI/token do Supabase conectado nesta maquina. Migrations sao escritas em `supabase/migrations/` e o dono do projeto aplica manualmente no SQL Editor do painel do Supabase (projeto com ref `hhdejsiehztxwtqejete`) — sempre fornecer o SQL pronto para colar.
- `supabase/policies/rls.sql` e o arquivo canonico com o estado atual de todas as RLS policies e funcoes `security definer`; manter sincronizado com as migrations numeradas.
- RLS: nunca fazer uma policy consultar a propria tabela em subquery direta (causa "infinite recursion detected in policy", erro 42P17) — usar funcao `security definer` (padrao ja usado em `is_admin`, `owns_channel`, `comment_parent_in_video`).
- `.env.local` tem `SUPABASE_SERVICE_ROLE_KEY` — usar para criar/apagar contas de teste descartaveis via REST (`/auth/v1/admin/users`), nunca para testar a app em si (isso bypassa RLS).

## Testando funcionalidades que exigem login

- Nunca reusar a sessao logada real do usuario no navegador para testes — criar conta descartavel via REST (signup com `${username}@contas.studiokids.internal`), testar, apagar a conta ao final (via service role).
- Rodar servidor de debug com `npm run dev` (cai na porta 3001, ja que a 3000 costuma estar ocupada pelo processo do proprio usuario) e sempre encerrar o processo ao terminar de testar.
- Nunca digitar a senha real do usuario em nenhum campo, mesmo que ele cole no chat — pedir para ele digitar.

## Testes automatizados

- `npm test` — Vitest (unit em `utils/`/`lib/validations.ts` + integracao das Server Actions criticas com Supabase mockado via `test/supabase-mock.ts`). Rapido, sem depender de rede.
- `npm run test:e2e` — Playwright (`e2e/golden-path.spec.ts`), roda contra o Supabase real do projeto (nao ha ambiente de teste separado) e sobe o `next dev` na porta 3001 sozinho. E pulado automaticamente se `SUPABASE_SERVICE_ROLE_KEY` nao estiver no `.env.local`.
- Contas descartaveis do e2e seguem a mesma regra da secao acima (criar/promover/apagar via service role em `e2e/helpers/test-account.ts`) — a service role so faz bootstrap de ambiente, a logica testada (cadastro, upload, moderacao) sempre roda pela UI de verdade.
- **Achado (2026-07-24):** a migration `0005_security_hardening.sql` adicionou um trigger `protect_profile_privileges` (BEFORE UPDATE em `profiles`) que so aceita mudanca de `role` vinda de quem ja e admin. Isso quebrou a instrucao do README de promover a primeira conta a admin via `UPDATE ... SET role = 'admin'` no SQL Editor — esse UPDATE cai no mesmo trigger e falha com "Somente administradores podem alterar papeis", mesmo rodando como superusuario (o trigger depende de `auth.uid()`, que e nulo fora de uma request autenticada). Hoje o unico jeito de promover alguem e ja estar logado como um admin existente e usar `/admin/usuarios`. O helper de e2e contorna isso apagando e reinserindo a linha do profile (o trigger e so BEFORE UPDATE, nao pega INSERT) — so serve para bootstrap de conta de teste, nunca usar esse truque para promover uma conta real. Vale atualizar o README ou adicionar um bootstrap alternativo (ex: RPC `security definer` para o primeiro admin) quando sobrar tempo.

## Deploy

- `git push origin main` aciona deploy automatico no Vercel (sem etapa manual). Ambiente de producao: `https://studio-kids-seven.vercel.app`.
- A lista de deployments no dashboard do Vercel as vezes mostra "Building" desatualizado — confirmar status pela pagina do deployment especifico ou testando a URL de producao diretamente.
