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

## Deploy

- `git push origin main` aciona deploy automatico no Vercel (sem etapa manual). Ambiente de producao: `https://studio-kids-seven.vercel.app`.
- A lista de deployments no dashboard do Vercel as vezes mostra "Building" desatualizado — confirmar status pela pagina do deployment especifico ou testando a URL de producao diretamente.
