-- Studio Kids — reacoes (like/dislike) em videos
-- Segue o modelo do YouTube: um usuario tem no maximo uma reacao ativa
-- por video (like OU dislike, nunca os dois). Contagens sao lidas por
-- agregacao (count) nas actions, nao guardadas em coluna denormalizada.

create type video_reaction_type as enum ('like', 'dislike');

create table public.video_reactions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  reaction video_reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index video_reactions_video_idx on public.video_reactions (video_id, reaction);

alter table public.video_reactions enable row level security;

create policy "video_reactions_select_all" on public.video_reactions
  for select using (true);

create policy "video_reactions_write_own" on public.video_reactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
