# Studio Kids — Roadmap

## Fase 0 — MVP (concluida nesta iteracao)

Autenticacao, upload e moderacao de video, canais, inscricoes, comentarios, notificacoes, playlists e navegacao completa funcionando de ponta a ponta contra um projeto Supabase real. Detalhe do que foi entregue: [CHECKLIST.md](CHECKLIST.md).

## Fase 1 — Fechar lacunas conhecidas do MVP

Prioridade alta, esforco relativamente baixo — completa o que a Fase 0 deixou como limitacao documentada.

- [ ] Deduplicar contagem de visualizacoes por usuario/sessao usando `video_progress` (hoje incrementa a cada page load).
- [ ] Upload direto ao Storage via signed URL + XHR, com progresso real por porcentagem de bytes (hoje e "por fase").
- [ ] "Continuar assistindo" na home usando `video_progress.seconds_watched`.
- [ ] Testes automatizados: unit para `utils/` e `lib/validations.ts`, integracao para as Server Actions criticas (upload, moderacao, assinatura), e2e do fluxo cadastro → upload → aprovacao → assistir.
- [ ] Atualizar `next` assim que uma versao corrigir o CVE moderado de `postcss` interno (ver Documento Tecnico, secao 5).

## Fase 2 — Engajamento e descoberta

- [ ] Recomendacao de videos (colaborativa simples: "quem assistiu X tambem assistiu Y") na home e na pagina de video.
- [ ] Notificacoes por e-mail (hoje so existem in-app) para novo inscrito, video aprovado/rejeitado.
- [ ] Curtir/nao curtir video (schema de `video_likes` planejado, ainda nao criado).
- [ ] Busca melhorada (hoje e `ilike` simples no titulo; considerar full-text search do Postgres ou pgvector para busca semantica).

## Fase 3 — Estrutura de conteudo avancada

- [ ] Cursos estruturados: agrupar videos em modulos com ordem e progresso agregado (tela `/admin/cursos` ja existe como placeholder).
- [ ] Certificados de conclusao.
- [ ] Transcricao automatica de video (Whisper ou Gemini multimodal) — ver ADR de IA no Documento Tecnico sobre quando revisitar a escolha de provedor.
- [ ] Legendas geradas a partir da transcricao.

## Fase 4 — Monetizacao

- [ ] Modelo de negocio a decidir com o time de produto: assinatura da plataforma (Netflix-style) vs pagamento por curso (Udemy-style) vs freemium com anuncios. Nenhuma decisao foi tomada ainda — bloqueante para iniciar esta fase.
- [ ] Integracao de pagamento (Stripe e o candidato natural dado o ecossistema Next.js/Vercel).
- [ ] Migrar bucket de videos pagos para privado + signed URLs (ja preparado como troca isolada em `services/storage/storage.service.ts`).

## Fase 5 — Institucional (turmas fechadas)

Fora do modelo de marketplace aberto escolhido para o MVP — so faz sentido se o produto expandir para venda B2B a escolas/empresas. Telas `/admin/turmas` e `/professor/alunos` ja tem placeholder reservando o espaco na navegacao.

- [ ] Turmas com matricula fechada (nao publica).
- [ ] Relatorio de progresso por aluno para o professor.
- [ ] Papel "gestor institucional" (acima de professor, abaixo de admin da plataforma).

## Fase 6 — Operacao e escala

- [ ] Analytics de produto (funil cadastro → primeiro video assistido → inscricao) — nenhuma ferramenta integrada ainda.
- [ ] Monitoramento/observabilidade (logs estruturados, alertas de erro em producao).
- [ ] Backup automatizado do banco (Supabase ja faz backup diario no plano pago; validar politica de retencao quando sair do free tier).
- [ ] CDN dedicada para video (avaliar Mux ou Cloudflare Stream se o volume de video justificar sair do Supabase Storage puro).
- [ ] Rate limiting em Server Actions publicas (comentarios, criacao de conta) contra abuso.

---

**Como priorizar:** Fase 1 antes de qualquer coisa — sao lacunas do proprio MVP, nao features novas. Fases 2–3 competem entre si por "o que traz mais retencao primeiro" e devem ser validadas com dados reais de uso assim que a Fase 0 estiver em producao, nao decididas especulativamente agora.
