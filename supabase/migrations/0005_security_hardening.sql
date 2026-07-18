-- Studio Kids — protege campos de privilegio e o fluxo de moderacao.
-- Execute depois das migrations 0001 a 0004.

-- Um usuario pode editar o proprio perfil, mas nao conceder privilegios a si
-- mesmo. A transicao student -> professor e permitida apenas durante o
-- onboarding; qualquer outra mudanca de papel exige um admin.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if public.is_admin() then
      return new;
    end if;

    if auth.uid() = old.id
       and old.role = 'student'
       and new.role = 'professor'
       and old.onboarding_completed_at is null
       and new.onboarding_completed_at is not null then
      return new;
    end if;

    raise exception 'Somente administradores podem alterar papeis';
  end if;
  return new;
end;
$$;

create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Mantem a edicao normal do proprio perfil e devolve ao admin a capacidade
-- de administrar contas, sem deixar de passar pelo trigger acima.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Professores podem enviar somente rascunhos/pendencias. Publicar, rejeitar
-- e alterar os metadados de moderacao sao operacoes exclusivas de admin.
drop policy if exists "videos_insert_owner" on public.videos;
create policy "videos_insert_owner" on public.videos
  for insert with check (
    public.owns_channel(channel_id)
    and status in ('draft', 'pending')
    and published_at is null
    and rejection_reason is null
  );

create or replace function public.protect_video_moderation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.status, new.published_at, new.rejection_reason)
       is distinct from (old.status, old.published_at, old.rejection_reason)
     and not public.is_admin() then
    raise exception 'Somente administradores podem moderar videos';
  end if;
  return new;
end;
$$;

create trigger protect_video_moderation
  before update on public.videos
  for each row execute function public.protect_video_moderation();

-- Comentarios so existem em videos publicados. Uma resposta precisa apontar
-- para um comentario do mesmo video, evitando encadeamentos inconsistentes.
drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_published_video" on public.comments
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.videos
      where videos.id = comments.video_id and videos.status = 'published'
    )
    and (
      parent_id is null or exists (
        select 1 from public.comments parent
        where parent.id = comments.parent_id and parent.video_id = comments.video_id
      )
    )
  );

-- A RPC de views nao deve ser chamada por anonimos nem contar videos que nao
-- estao publicados. A deduplicacao por usuario/sessao fica para a proxima
-- migration de analytics.
create or replace function public.increment_video_views(video_id_input uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.videos
  set views_count = views_count + 1
  where id = video_id_input and status = 'published';
$$;

revoke all on function public.increment_video_views(uuid) from public;
grant execute on function public.increment_video_views(uuid) to authenticated;
