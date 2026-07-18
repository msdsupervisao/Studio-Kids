-- Studio Kids — paridade com o composer de comunidade do YouTube Studio:
-- posts com imagem, enquete de imagem, video anexado, agendamento e
-- arquivamento (abas Publicadas / Agendadas / Arquivadas).

alter type channel_post_kind add value if not exists 'image';
alter type channel_post_kind add value if not exists 'image_poll';
alter type channel_post_kind add value if not exists 'video';

alter table public.channel_posts
  add column if not exists image_path text,
  add column if not exists option_images jsonb not null default '[]'::jsonb,
  add column if not exists video_id uuid references public.videos (id) on delete set null,
  add column if not exists status text not null default 'published',
  add column if not exists scheduled_at timestamptz;

alter table public.channel_posts
  add constraint channel_post_status_valid check (status in ('published', 'scheduled', 'archived')),
  add constraint channel_post_scheduled_requires_time check (status <> 'scheduled' or scheduled_at is not null),
  add constraint channel_post_option_images_array check (jsonb_typeof(option_images) = 'array');

create index if not exists channel_posts_video_id_idx on public.channel_posts (video_id);

-- Visitantes veem apenas posts publicados (ou agendados cujo horario ja
-- chegou); o dono do canal e admins veem tudo, inclusive agendados e
-- arquivados, para popular as abas de gestao.
drop policy if exists "channel_posts_select_all" on public.channel_posts;
create policy "channel_posts_select_visible" on public.channel_posts for select using (
  status = 'published'
  or (status = 'scheduled' and scheduled_at <= now())
  or public.owns_channel(channel_id)
  or public.is_admin()
);

-- ---------------------------------------------------------------------
-- Bucket para imagens de post da comunidade (post unico e enquete de
-- imagem). Mesmo padrao de banners/thumbnails: publico para leitura,
-- escrita restrita ao dono do canal (pasta = channel_id).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "post_images_public_read" on storage.objects
  for select using (bucket_id = 'post-images');

create policy "post_images_write_channel_owner" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "post_images_update_channel_owner" on storage.objects
  for update using (
    bucket_id = 'post-images'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "post_images_delete_channel_owner" on storage.objects
  for delete using (
    bucket_id = 'post-images'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );
