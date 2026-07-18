-- Studio Kids — Shorts
-- Shorts sao apenas videos com is_short = true (vertical, ate 60s) — nao
-- e uma tabela separada, reaproveitam toda a infraestrutura existente
-- (moderacao, likes, comentarios, storage). O grid normal (/inicio,
-- /explorar) filtra is_short = false; o feed vertical (/shorts) filtra
-- is_short = true.

alter table public.videos add column is_short boolean not null default false;

create index videos_shorts_idx on public.videos (is_short, published_at desc);
