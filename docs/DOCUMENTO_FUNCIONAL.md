# Studio Kids — Documento Funcional

## 1. Visao do produto

Studio Kids e um marketplace aberto de video-aulas: qualquer pessoa pode criar uma conta, e quem quer ensinar cria um canal e publica videos; quem quer aprender assiste, se inscreve em canais e comenta. E o modelo YouTube/Udemy, nao um LMS institucional fechado — nao ha turmas obrigatorias nem matricula paga no MVP.

**Decisao registrada:** modelo de marketplace aberto foi escolhido explicitamente (em vez de plataforma institucional ou corporativa) porque maximiza a velocidade de crescimento de catalogo — qualquer professor pode publicar sem esperar um admin cadastra-lo manualmente — ao custo de exigir moderacao de conteudo pos-publicacao, que o MVP resolve com uma fila de aprovacao antes do video ficar publico.

## 2. Publico-alvo e personas

### Persona 1 — Aluno (Camila, 24 anos)
Estudante universitaria buscando complementar o aprendizado formal com aulas gratuitas ou pagas de alta qualidade. Usa o celular no transporte publico e o notebook a noite. Valoriza: encontrar rapido o video certo, continuar de onde parou, nao se perder em interface poluida de anuncios.

### Persona 2 — Professor/Criador (Marcelo, 34 anos)
Professor de cursinho que quer expandir alcance publicando aulas gravadas. Nao e desenvolvedor nem editor de video profissional. Valoriza: processo de upload simples, entender por que um video foi rejeitado, ver quantas pessoas assistiram.

### Persona 3 — Moderador/Admin (equipe Studio Kids)
Responsavel por manter qualidade minima do catalogo (nada ofensivo, nada com audio/video quebrado, titulo condizente com o conteudo). Valoriza: fila de moderacao curta e rapida de processar, capacidade de rejeitar com motivo claro.

## 3. Papeis e permissoes

| Papel | Pode | Nao pode |
|---|---|---|
| **student** (padrao ao cadastrar) | Assistir videos publicados, comentar, se inscrever em canais, criar playlists | Criar canal, enviar video |
| **professor** | Tudo que student pode + criar canal(is), enviar videos (ficam `pending` ate aprovacao), editar/excluir os proprios videos e canais, ver estatisticas dos proprios canais | Aprovar/rejeitar os proprios videos, moderar outros usuarios |
| **admin** | Tudo que professor pode + aprovar/rejeitar qualquer video, gerenciar categorias, promover/rebaixar papel de qualquer usuario | — |

O papel e escolhido no onboarding (`/primeiro-acesso`) logo apos o cadastro: "Quero aprender" define `student`, "Quero ensinar" define `professor` e cria o primeiro canal na mesma etapa. Promocao a `admin` e feita hoje via SQL direto no Supabase (ver README) — nao ha auto-servico, decisao deliberada para o MVP dado que admins sao a propria equipe operadora da plataforma.

## 4. Jornadas do usuario

### 4.1 Cadastro e primeiro acesso
1. Usuario acessa `/login`, alterna para "Criar conta", preenche nome, usuario, e-mail e senha.
2. Supabase Auth cria o registro; um trigger no banco (`handle_new_user`) cria a linha correspondente em `profiles` automaticamente — o app nunca insere profile manualmente no signup.
3. Usuario e redirecionado a `/primeiro-acesso`, onde escolhe "aprender" ou "ensinar".
4. Se "ensinar": preenche nome e endereco do canal na mesma tela; canal e criado junto com a confirmacao do papel.
5. Usuario cai em `/inicio`.

### 4.2 Assistir e engajar (aluno)
1. Aluno navega por `/inicio` (feed geral), `/explorar` (por categoria) ou usa a busca na Topbar.
2. Abre um video em `/video/[id]`: player, titulo, canal com botao de inscricao, descricao, comentarios.
3. Pode comentar (exige login), responder comentarios existentes, se inscrever no canal.
4. Visualizacoes sao contadas a cada carregamento da pagina do video (aproximacao, nao "unique view" deduplicado — ver Documento Tecnico).

### 4.3 Publicar uma aula (professor)
1. Professor acessa `/upload` (bloqueado para quem nao e professor/admin).
2. Se nao tem canal ainda, e direcionado a criar um em `/professor/canais`.
3. Preenche titulo, descricao, categoria, arrasta o arquivo de video (deteccao automatica de duracao no navegador) e, opcionalmente, uma thumbnail.
4. Pode usar "Melhorar com IA" para gerar titulo/descricao/tags sugeridos a partir de um rascunho — sempre revisavel antes de enviar.
5. Ao enviar, o video e criado com status `pending` e fica invisivel ao publico ate aprovacao.
6. Professor acompanha o status em `/professor/videos` (badge de status) ou `/professor/aprovacoes` (lista so o que ainda nao foi publicado, com motivo se rejeitado).

### 4.4 Moderar (admin)
1. Admin acessa `/admin/uploads`, ve a fila de videos `pending` ordenada por data de envio (mais antigos primeiro).
2. Aprova (video vira `published`, `published_at` e preenchido, fica visivel a todos) ou rejeita (exige motivo, visivel ao professor).

## 5. Regras de negocio

- Um video so aparece nas listagens publicas (`/inicio`, `/explorar`, busca, canal) quando `status = published`.
- O dono do canal sempre ve todos os proprios videos, independente do status (RLS garante isso no banco, nao so na UI).
- Um usuario nao pode se inscrever no proprio canal (botao de inscricao nao aparece para o dono).
- Username segue o padrao `^[a-z0-9_.]{3,30}$` e e unico; slug de canal segue `^[a-z0-9-]{3,50}$` e e unico.
- Exclusao de um canal remove em cascata seus videos (`on delete cascade` no schema) — nao ha "arquivar", so exclusao definitiva.
- Comentarios sao rasos (uma resposta por comentario original) — nao ha threads aninhadas alem de um nivel.

## 6. Fora do escopo do MVP (ver ROADMAP.md)

Cursos estruturados com modulos, turmas fechadas de uso institucional, pagamento/monetizacao, certificados, gamificacao (badges/streaks) e relatorios avancados nao fazem parte deste MVP. As telas correspondentes existem no app com aviso "em construcao" para preservar a navegacao e a arquitetura de pastas pensada para essas fases futuras.
