# EduTube

Plataforma de video-aulas em formato marketplace aberto: qualquer professor cria um canal e publica aulas em video; qualquer aluno assiste, se inscreve e comenta. Publicacoes passam por moderacao (admin) antes de ficarem publicas.

Stack: **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Auth + Storage) · IA plugavel (Claude por padrao)**.

Documentacao completa em [`docs/`](docs):
- [DOCUMENTO_FUNCIONAL.md](docs/DOCUMENTO_FUNCIONAL.md) — personas, jornadas, regras de negocio
- [DOCUMENTO_TECNICO.md](docs/DOCUMENTO_TECNICO.md) — arquitetura, schema, seguranca, decisoes tecnicas
- [ROADMAP.md](docs/ROADMAP.md) — o que existe hoje vs proximas fases
- [CHECKLIST.md](docs/CHECKLIST.md) — status de cada area do produto

## Como rodar localmente

### 1. Pre-requisitos
- Node.js 20+
- Uma conta [Supabase](https://supabase.com) (plano free serve)

### 2. Criar o projeto no Supabase
1. Crie um novo projeto em [app.supabase.com](https://app.supabase.com).
2. No **SQL Editor**, rode nesta ordem:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/policies/rls.sql`
   - `supabase/storage.sql`
   - `supabase/seed.sql`
3. Em **Project Settings > API**, copie a `Project URL`, a `anon public key` e a `service_role key`.

### 3. Configurar variaveis de ambiente
```bash
cp .env.local.example .env.local
```
Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` com os valores do passo anterior. `ANTHROPIC_API_KEY` e opcional — sem ela, o botao "Melhorar com IA" no upload fica indisponivel, mas o resto do app funciona normalmente.

### 4. Instalar e rodar
```bash
npm install
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000).

### 5. Criar sua primeira conta
1. Cadastre-se pela tela de login (`/login` > "Criar conta").
2. Complete o onboarding escolhendo "Quero ensinar" para virar professor e criar um canal automaticamente.
3. Para aprovar seus proprios videos em ambiente de teste, promova sua conta a admin via SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where username = 'seu_usuario';
   ```
4. Envie um video em `/upload`, depois aprove-o em `/admin/uploads`.

## Scripts

| Comando | Descricao |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de producao |
| `npm run start` | Sobe o build de producao |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos sem emitir arquivos |

## Estrutura do projeto

```
app/                  # Rotas (App Router), agrupadas por area: (auth) (app) (professor) (admin)
components/ui/        # Primitivos shadcn (Button, Input, Select, ...)
components/layout/    # Topbar, Sidebar, AppShell
components/shared/    # VideoCard, ChannelCard, EmptyState, PlaylistCard, ThemeToggle
features/<dominio>/   # actions/ (Server Actions) + components/ por dominio de negocio
services/              # Integracao com Supabase, Storage e IA — unico lugar que fala com SDKs externos
lib/                   # env, constants, validations (zod), cn()
utils/                 # format, sanitize, slug — funcoes puras sem dependencia externa
types/                 # Tipos compartilhados, incluindo database.types.ts (espelha o schema SQL)
supabase/              # migrations, RLS policies, storage buckets, seed
```

## Estado atual

Este e um **MVP funcional**: autenticacao, upload de video, reproducao, canais, inscricoes, comentarios, moderacao, notificacoes e playlists estao implementados de ponta a ponta. Areas fora do escopo do MVP (cursos estruturados, turmas fechadas, relatorios avancados) tem paginas com aviso "em construcao" e estao detalhadas no [ROADMAP.md](docs/ROADMAP.md).
