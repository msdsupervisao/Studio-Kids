-- Comunicados do canal: atualizacoes, enquetes e questionarios.
create type channel_post_kind as enum ('text', 'poll', 'quiz');

create table public.channel_posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind channel_post_kind not null default 'text',
  content text not null default '',
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint channel_post_content check (char_length(content) <= 2000),
  constraint channel_post_options_array check (jsonb_typeof(options) = 'array')
);

create index channel_posts_channel_created_idx on public.channel_posts (channel_id, created_at desc);
create trigger set_updated_at before update on public.channel_posts
  for each row execute function public.set_updated_at();

create table public.channel_post_votes (
  post_id uuid not null references public.channel_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  option_index smallint not null check (option_index >= 0),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.channel_posts enable row level security;
alter table public.channel_post_votes enable row level security;

create policy "channel_posts_select_all" on public.channel_posts for select using (true);
create policy "channel_posts_insert_owner" on public.channel_posts for insert with check (
  auth.uid() = author_id and public.owns_channel(channel_id)
);
create policy "channel_posts_update_owner" on public.channel_posts for update using (
  public.owns_channel(channel_id) or public.is_admin()
) with check (public.owns_channel(channel_id) or public.is_admin());
create policy "channel_posts_delete_owner" on public.channel_posts for delete using (
  public.owns_channel(channel_id) or public.is_admin()
);

create policy "channel_post_votes_select_all" on public.channel_post_votes for select using (true);
create policy "channel_post_votes_insert_own" on public.channel_post_votes for insert with check (auth.uid() = user_id);
create policy "channel_post_votes_update_own" on public.channel_post_votes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "channel_post_votes_delete_own" on public.channel_post_votes for delete using (auth.uid() = user_id);
