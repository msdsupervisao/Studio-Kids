-- EduTube — Storage buckets
-- Convencao de path:
--   videos/{channel_id}/{video_id}.mp4
--   thumbnails/{channel_id}/{video_id}.jpg
--   avatars/{user_id}.jpg
--   banners/{channel_id}.jpg
--
-- Nota de seguranca (MVP): os buckets de midia sao publicos para leitura
-- (necessario para <video>/<img> tocarem direto da CDN do Supabase sem
-- assinar URL a cada request). Isso significa que um video "pending" ou
-- "rejected" pode ser acessado por URL direta caso alguem descubra o
-- path exato (nao e listavel, nao aparece em nenhuma query publica).
-- Para conteudo pago/restrito no futuro, migrar para bucket privado +
-- signed URLs de curta duracao (services/storage/storage.service.ts ja
-- isola essa decisao para trocar sem afetar o resto do app).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('videos', 'videos', true, 2147483648, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('thumbnails', 'thumbnails', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 3145728, array['image/jpeg', 'image/png', 'image/webp']),
  ('banners', 'banners', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Leitura publica em todos os buckets de midia
-- ---------------------------------------------------------------------
create policy "media_public_read" on storage.objects
  for select using (bucket_id in ('videos', 'thumbnails', 'avatars', 'banners'));

-- ---------------------------------------------------------------------
-- videos / thumbnails — apenas o dono do canal (primeiro segmento do
-- path = channel_id) pode escrever
-- ---------------------------------------------------------------------
create policy "videos_write_channel_owner" on storage.objects
  for insert with check (
    bucket_id = 'videos'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "videos_update_channel_owner" on storage.objects
  for update using (
    bucket_id = 'videos'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "videos_delete_channel_owner" on storage.objects
  for delete using (
    bucket_id = 'videos'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "thumbnails_write_channel_owner" on storage.objects
  for insert with check (
    bucket_id = 'thumbnails'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "thumbnails_update_channel_owner" on storage.objects
  for update using (
    bucket_id = 'thumbnails'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "thumbnails_delete_channel_owner" on storage.objects
  for delete using (
    bucket_id = 'thumbnails'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------
-- banners — mesmo padrao (path prefixado por channel_id)
-- ---------------------------------------------------------------------
create policy "banners_write_channel_owner" on storage.objects
  for insert with check (
    bucket_id = 'banners'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "banners_update_channel_owner" on storage.objects
  for update using (
    bucket_id = 'banners'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

create policy "banners_delete_channel_owner" on storage.objects
  for delete using (
    bucket_id = 'banners'
    and public.owns_channel(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------
-- avatars — path prefixado por user_id (auth.uid())
-- ---------------------------------------------------------------------
create policy "avatars_write_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
