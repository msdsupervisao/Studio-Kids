-- A policy "comments_insert_published_video" (0005) valida que um reply
-- aponta para um comentario do mesmo video usando uma subquery direta em
-- public.comments. Como a tabela tem RLS habilitado, essa subquery reavalia
-- as policies de select de comments durante o proprio insert, e o Postgres
-- detecta isso como recursao infinita (42P17) — quebrando TODOS os inserts
-- de comentario, nao so os de video pendente. Resolvido com uma funcao
-- security definer, igual ao padrao ja usado em is_admin/owns_channel.

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

revoke all on function public.comment_parent_in_video(uuid, uuid) from public;
grant execute on function public.comment_parent_in_video(uuid, uuid) to authenticated;

drop policy if exists "comments_insert_published_video" on public.comments;
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
