-- "Ver mais tarde" — lista pessoal de videos salvos para assistir depois,
-- espelhando o padrao ja usado em subscriptions (chave composta user+video).

create table public.watch_later (
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index watch_later_user_idx on public.watch_later (user_id, added_at desc);

alter table public.watch_later enable row level security;

create policy "watch_later_select_own" on public.watch_later
  for select using (auth.uid() = user_id);

create policy "watch_later_insert_own" on public.watch_later
  for insert with check (auth.uid() = user_id);

create policy "watch_later_delete_own" on public.watch_later
  for delete using (auth.uid() = user_id);
