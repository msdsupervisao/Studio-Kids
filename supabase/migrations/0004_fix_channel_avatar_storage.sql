-- Studio Kids — corrige upload de avatar de canal
-- O bucket "avatars" foi desenhado so para avatar pessoal (pasta =
-- auth.uid()), mas features/canal/actions/channel.actions.ts salva o
-- avatar do canal usando o channel_id como pasta (avatars/{channel_id}/...).
-- Sem isso, o upload de avatar de canal sempre falhava com "new row
-- violates row-level security policy". Agora a policy libera as duas
-- convencoes: pasta = auth.uid() (avatar pessoal) OU pasta = canal que o
-- usuario possui (avatar de canal) — mesmo padrao ja usado em
-- videos/thumbnails/banners.

drop policy "avatars_write_own" on storage.objects;
drop policy "avatars_update_own" on storage.objects;
drop policy "avatars_delete_own" on storage.objects;

create policy "avatars_write_own_or_channel" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.owns_channel(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "avatars_update_own_or_channel" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.owns_channel(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "avatars_delete_own_or_channel" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.owns_channel(((storage.foldername(name))[1])::uuid)
    )
  );
