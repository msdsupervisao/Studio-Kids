-- Studio Kids — Row Level Security
-- Principio: nada e liberado por padrao. Cada tabela tem RLS habilitado e
-- so as operacoes explicitamente descritas abaixo sao permitidas.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.channels enable row level security;
alter table public.videos enable row level security;
alter table public.subscriptions enable row level security;
alter table public.comments enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_videos enable row level security;
alter table public.video_progress enable row level security;
alter table public.notifications enable row level security;
alter table public.watch_later enable row level security;

-- ---------------------------------------------------------------------
-- Helpers — security definer para evitar recursao de RLS ao checar role
-- ---------------------------------------------------------------------
create function public.current_role()
returns user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create function public.owns_channel(channel_id_input uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.channels
    where id = channel_id_input and owner_id = auth.uid()
  );
$$;

create function public.comment_parent_in_video(parent_id_input uuid, video_id_input uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.comments
    where id = parent_id_input and video_id = video_id_input
  );
$$;

-- ---------------------------------------------------------------------
-- profiles — publico para leitura (perfis sao paginas publicas), somente
-- o proprio usuario edita o proprio registro. Insert e feito apenas pelo
-- trigger handle_new_user (security definer), entao nao ha policy de
-- insert para o role authenticated.
-- ---------------------------------------------------------------------
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- categories — leitura publica, escrita restrita a admin
-- ---------------------------------------------------------------------
create policy "categories_select_all" on public.categories
  for select using (true);

create policy "categories_write_admin" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- channels — leitura publica, escrita pelo dono (role professor/admin)
-- ---------------------------------------------------------------------
create policy "channels_select_all" on public.channels
  for select using (true);

create policy "channels_insert_owner" on public.channels
  for insert with check (
    auth.uid() = owner_id
    and public.current_role() in ('professor', 'admin')
  );

create policy "channels_update_owner" on public.channels
  for update using (auth.uid() = owner_id or public.is_admin())
  with check (auth.uid() = owner_id or public.is_admin());

create policy "channels_delete_owner" on public.channels
  for delete using (auth.uid() = owner_id or public.is_admin());

-- ---------------------------------------------------------------------
-- videos — publicados sao publicos; rascunho/pendente/rejeitado so para
-- o dono do canal e admin (moderacao)
-- ---------------------------------------------------------------------
create policy "videos_select_published" on public.videos
  for select using (
    status = 'published'
    or public.owns_channel(channel_id)
    or public.is_admin()
  );

create policy "videos_insert_owner" on public.videos
  for insert with check (public.owns_channel(channel_id));

create policy "videos_update_owner_or_admin" on public.videos
  for update using (public.owns_channel(channel_id) or public.is_admin())
  with check (public.owns_channel(channel_id) or public.is_admin());

create policy "videos_delete_owner_or_admin" on public.videos
  for delete using (public.owns_channel(channel_id) or public.is_admin());

-- ---------------------------------------------------------------------
-- subscriptions — usuario gerencia as proprias inscricoes; contagem por
-- canal e publica (select liberado)
-- ---------------------------------------------------------------------
create policy "subscriptions_select_all" on public.subscriptions
  for select using (true);

create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = subscriber_id);

create policy "subscriptions_delete_own" on public.subscriptions
  for delete using (auth.uid() = subscriber_id);

-- ---------------------------------------------------------------------
-- comments — leitura publica em videos publicados, escrita autenticada,
-- edicao/remocao apenas do autor ou admin
-- ---------------------------------------------------------------------
create policy "comments_select_public" on public.comments
  for select using (
    exists (
      select 1 from public.videos
      where videos.id = comments.video_id and videos.status = 'published'
    )
  );

create policy "comments_insert_published_video" on public.comments
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.videos
      where videos.id = comments.video_id and videos.status = 'published'
    )
    and (
      parent_id is null or public.comment_parent_in_video(parent_id, video_id)
    )
  );

create policy "comments_update_own" on public.comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "comments_delete_own_or_admin" on public.comments
  for delete using (auth.uid() = author_id or public.is_admin());

-- ---------------------------------------------------------------------
-- playlists — publicas sao visiveis a todos, privadas so ao dono
-- ---------------------------------------------------------------------
create policy "playlists_select_visible" on public.playlists
  for select using (is_public = true or auth.uid() = owner_id);

create policy "playlists_insert_own" on public.playlists
  for insert with check (auth.uid() = owner_id);

create policy "playlists_update_own" on public.playlists
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "playlists_delete_own" on public.playlists
  for delete using (auth.uid() = owner_id);

create policy "playlist_videos_select_visible" on public.playlist_videos
  for select using (
    exists (
      select 1 from public.playlists
      where playlists.id = playlist_videos.playlist_id
        and (playlists.is_public = true or playlists.owner_id = auth.uid())
    )
  );

create policy "playlist_videos_write_own" on public.playlist_videos
  for all using (
    exists (
      select 1 from public.playlists
      where playlists.id = playlist_videos.playlist_id and playlists.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists
      where playlists.id = playlist_videos.playlist_id and playlists.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- video_progress — estritamente privado ao usuario
-- ---------------------------------------------------------------------
create policy "video_progress_own" on public.video_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- watch_later — estritamente privado ao usuario
-- ---------------------------------------------------------------------
create policy "watch_later_select_own" on public.watch_later
  for select using (auth.uid() = user_id);

create policy "watch_later_insert_own" on public.watch_later
  for insert with check (auth.uid() = user_id);

create policy "watch_later_delete_own" on public.watch_later
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- notifications — leitura/atualizacao (marcar como lida) apenas do dono;
-- insercao e feita pelo backend com service role (sem policy de insert
-- para authenticated)
-- ---------------------------------------------------------------------
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
