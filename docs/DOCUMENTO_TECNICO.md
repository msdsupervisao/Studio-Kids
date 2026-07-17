# Studio Kids — Documento Tecnico

## 1. Stack e por que

| Camada | Escolha | Por que |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 | Server Components eliminam a maior parte do client JS; Server Actions substituem uma camada de API REST inteira para mutacoes; SSR/SSG por rota sem infra extra. |
| Linguagem | TypeScript (strict) | `noUncheckedIndexedAccess` ligado — pegou bugs reais durante o build (ver secao 6). |
| Estilo | Tailwind CSS v4 + shadcn/ui (new-york) | Design tokens via `@theme` em CSS puro (sem `tailwind.config.js` gigante), componentes copiados para o repo (nao uma dependencia de terceiros que muda sem aviso). |
| Banco | Supabase (Postgres) | Postgres real (nao um BaaS proprietario) + Auth + Storage + Row Level Security no mesmo produto, sem precisar orquestrar 3 servicos separados para o MVP. |
| Auth | Supabase Auth via `@supabase/ssr` | Cookies httpOnly geridos pelo proprio Next middleware; sem gerenciar JWT manualmente no client. |
| Storage de midia | Supabase Storage (buckets publicos) | Video/thumbnail/avatar/banner servidos direto da CDN do Supabase; ver secao 5 sobre a troca feita (bucket publico vs signed URL). |
| IA | Camada propria (`services/ia`) com providers plugaveis | Claude (Anthropic) e o padrao (ver ADR abaixo), mas trocar de provedor e mudar uma env var — nenhuma feature fala com SDK de IA diretamente. |

## 2. Arquitetura

```
Requisicao do navegador
        │
        ▼
middleware.ts ──── refresca sessao Supabase, redireciona por auth/role
        │
        ▼
app/(grupo)/.../page.tsx  (Server Component)
        │
        ├─── chama features/<dominio>/actions/*.ts  (Server Actions, "use server")
        │           │
        │           ▼
        │     services/supabase/server.ts  →  Postgres (RLS aplicado por usuario logado)
        │     services/storage/storage.service.ts → Supabase Storage
        │     services/ia/ai.service.ts → provider de IA configurado
        │
        └─── renderiza components/shared + features/<dominio>/components (Client Components pontuais)
```

**Principio seguido:** toda escrita/leitura de dado passa por uma Server Action em `features/<dominio>/actions/`. Nenhum componente cliente chama o SDK do Supabase diretamente para mutacoes — client components chamam a Server Action (que pode ser importada e invocada como funcao normal, o Next serializa a chamada). Isso mantem a logica de negocio no servidor, testavel e auditavel num unico lugar por dominio.

## 3. Arquitetura da informacao (rotas)

- `(auth)` — `/login`, `/esqueci-senha`: publicas, layout minimo centralizado.
- `(app)` — area logada geral: `/inicio`, `/explorar`, `/pesquisa`, `/videos`, `/video/[id]`, `/canal/[slug]`, `/meu-canal`, `/upload`, `/playlists`, `/notificacoes`, `/perfil`, `/configuracoes`, `/estatisticas`, `/primeiro-acesso`.
- `(professor)` — exige `role in (professor, admin)`: `/professor`, `/professor/videos`, `/professor/canais`, `/professor/aprovacoes`, `/professor/alunos`.
- `(admin)` — exige `role = admin`: `/admin`, `/admin/uploads` (moderacao), `/admin/categorias`, `/admin/usuarios`, `/admin/cursos`, `/admin/turmas`, `/admin/storage`, `/admin/configuracoes`.

Grupos de rota (parenteses) nao aparecem na URL — servem só para aplicar layouts (`AppShell` com nav diferente) e nao afetam o caminho real, que e sempre plano (`/professor/videos`, nao `/professor/professor/videos`).

## 4. Modelo de dados

Ver `supabase/migrations/0001_schema.sql` para a fonte da verdade. Resumo das tabelas e relacoes:

```
profiles (1) ──< channels (1) ──< videos (N) ──< comments (N, auto-referenciada p/ respostas)
profiles (N) ──< subscriptions >── channels
profiles (1) ──< playlists (1) ──< playlist_videos >── videos
profiles (1) ──< video_progress >── videos
profiles (1) ──< notifications
categories (1) ──< videos
```

Decisoes relevantes:
- **`profiles` espelha `auth.users`** via trigger `handle_new_user` (security definer) — o app nunca faz `insert` direto em `profiles` no signup, evitando um profile orfao se o insert falhar depois do `auth.users` já ter sido criado.
- **`views_count` incrementa via função `increment_video_views` (RPC, security definer)** em vez de "ler o valor atual e escrever +1" no client — evita race condition de contagem quando varios usuarios assistem ao mesmo tempo.
- **`status` de video** e uma maquina de estados simples: `draft → pending → published | rejected`. Nao ha `draft` gerado pela UI hoje (todo upload vai direto a `pending`), o valor existe no enum para uma futura feature de "salvar rascunho".

## 5. Seguranca

- **RLS habilitado em 100% das tabelas** (`supabase/policies/rls.sql`) — a UI nunca e a unica barreira; mesmo que um bug no frontend tente ler/escrever algo indevido, o Postgres recusa.
- **Funcoes helper `is_admin()`, `owns_channel()`, `current_role()`** rodam como `security definer` para evitar recursao de RLS ao checar o proprio `profiles` dentro de uma policy de outra tabela.
- **Storage**: buckets `videos`/`thumbnails`/`avatars`/`banners` sao publicos para leitura (necessario para `<video>`/`<img>` tocarem direto da CDN sem assinar URL a cada request) mas escrita e restrita ao dono do canal/usuario via policy em `storage.objects` que le o primeiro segmento do path (`{channel_id}/...` ou `{user_id}/...`).
  - **Troca consciente:** um video `pending`/`rejected` pode ser acessado por URL direta caso alguem descubra o path exato (nao e listavel nem aparece em nenhuma query publica). Para conteudo pago/restrito no futuro, a recomendacao e migrar para bucket privado + signed URLs de curta duracao — a troca fica isolada em `services/storage/storage.service.ts`, nenhuma feature precisa mudar.
- **Sanitizacao de texto**: `utils/sanitize.ts` remove caracteres de controle/zero-width de todo input de usuario (comentarios, bio, descricoes). Como nada e renderizado com `dangerouslySetInnerHTML`, o React ja escapa HTML por padrao — o risco de XSS classico via texto nao existe hoje; o sanitize existe para higienizar dado "sujo", nao para neutralizar HTML.
- **`SUPABASE_SERVICE_ROLE_KEY`** (que ignora RLS) so e usada em `createServiceRoleClient()`, chamada apenas por `notifyUser()` (criar notificacao para OUTRO usuario que nao o da sessao atual) — nunca importada em codigo que roda no cliente.
- **Dependencia vulneravel conhecida:** `next@15.5.20` ainda carrega uma versao de `postcss` interna com um CVE moderado (XSS em stringify de CSS, `GHSA-qx2v-qp2m-jg93`). `npm audit fix --force` tentaria fazer downgrade do Next para `9.3.3`, o que quebraria o projeto — a mitigacao correta e aguardar um patch do Next que atualize sua dependencia interna, nao forcar o downgrade. Documentado aqui para nao ser esquecido.

## 6. Decisao tecnica registrada: `types/database.types.ts`

O tipo `Database` e escrito a mao (nao gerado via `supabase gen types`, que exige CLI + projeto linkado). `@supabase/supabase-js@2.110` exige uma forma estrutural especifica (`GenericSchema`: cada tabela precisa de `Relationships: [...]`, o schema precisa de `Views`/`Enums`/`CompositeTypes`, e o tipo `Database` precisa do marcador `__InternalSupabase: { PostgrestVersion: "12" }`) — sem isso, o `Schema` generico colapsa silenciosamente para `never` e toda chamada `.from(...).select(...)` perde tipagem sem erro visivel ate voce tentar acessar uma propriedade. Alem disso, os tipos `Row`/`Insert`/`Update` de cada tabela sao definidos como aliases nomeados independentes (`ProfilesRow`, `ChannelsRow`, ...) em vez de auto-referenciar `Database["public"]["Tables"]["x"]["Row"]` de dentro da propria interface `Database` — a auto-referencia circular faz o TypeScript produzir instanciacoes estruturalmente identicas porem nominalmente distintas em arquivos diferentes, quebrando a atribuicao de `SupabaseClient<Database>` entre `services/supabase/server.ts` e `services/storage/storage.service.ts`. Se algum dia migrar para `supabase gen types`, o output gerado automaticamente ja segue esse mesmo formato — a troca e transparente.

## 7. IA — ADR (Architecture Decision Record)

**Decisao:** Claude (Anthropic) como provedor padrao (`AI_PROVIDER=anthropic`), com Gemini/OpenAI/OpenRouter implementados e plugaveis via mesma interface (`services/ia/ai-provider.interface.ts`).

**Alternativas consideradas:** Gemini (mais barato, nativamente multimodal — melhor se o roadmap incluir analise direta de video/transcricao automatica) e OpenAI (ecossistema mais maduro de ferramentas: Whisper para transcricao, embeddings, moderacao de conteudo via API dedicada).

**Por que Claude ganhou para o caso de uso atual:** a unica feature de IA implementada hoje (`suggestVideoMetadata`) gera titulo/descricao/tags a partir de um rascunho de texto — um problema de geracao de conteudo educacional em portugues com nuance pedagogica, onde Claude historicamente tem menos alucinacao em textos longos estruturados. Nenhuma feature atual depende de multimodalidade (audio/video), entao a vantagem do Gemini nesse eixo nao se aplica ainda.

**Quando revisitar:** se o roadmap avancar para transcricao automatica de video ou moderacao de conteudo via IA (analisar o proprio arquivo de video/audio), Gemini ou o Whisper da OpenAI passam a ser fortes candidatos — a troca e so mudar `AI_PROVIDER` no `.env`, sem tocar em `features/ia` ou `app/api/ia/route.ts`.

## 8. Limitacoes conhecidas (nao sao bugs — sao trade-offs documentados)

- **Contagem de visualizacoes** incrementa a cada carregamento de `/video/[id]`, incluindo refresh manual do mesmo usuario — nao ha deduplicacao por usuario/sessao ainda. A tabela `video_progress` ja existe no schema para suportar isso numa iteracao futura.
- **Progresso do upload** e reportado por fase ("enviando..."), nao por porcentagem exata de bytes — Server Actions do Next ainda nao expoem progresso de upload nativo. Upload direto ao Storage via signed URL + XHR resolveria isso, listado no ROADMAP.
- **Sem testes automatizados** neste MVP (nem unit nem e2e) — priorizado terminar o fluxo funcional ponta a ponta primeiro. Plano de testes descrito no ROADMAP.

## 9. Como validar localmente sem credenciais reais

`npm run build` e `npm run typecheck` passam mesmo sem um projeto Supabase real (usam apenas placeholders de env var). Para testar fluxos reais (login, upload, RLS), e necessario um projeto Supabase com as migrations aplicadas — ver README.md.
