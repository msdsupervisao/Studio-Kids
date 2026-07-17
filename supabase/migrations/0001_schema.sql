-- Studio Kids — schema inicial
-- Marketplace aberto: qualquer usuario com role "professor" pode criar um
-- canal e publicar videos; a publicacao passa por aprovacao (status
-- "pending" -> "published"/"rejected") para manter qualidade minima.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role as enum ('student', 'professor', 'admin');
create type video_status as enum ('draft', 'pending', 'published', 'rejected');

-- ---------------------------------------------------------------------
-- profiles — espelha auth.users, guarda dados de perfil e role
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text not null,
  avatar_url text,
  bio text,
  role user_role not null default 'student',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_.]{3,30}$')
);

create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------
-- categories — taxonomia de conteudo (gerida pelo admin)
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- channels — um professor pode ter mais de um canal
-- ---------------------------------------------------------------------
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  avatar_url text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint slug_format check (slug ~ '^[a-z0-9-]{3,50}$')
);

create index channels_owner_idx on public.channels (owner_id);

-- ---------------------------------------------------------------------
-- videos
-- ---------------------------------------------------------------------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  video_path text not null,
  thumbnail_path text,
  duration_seconds integer not null default 0,
  status video_status not null default 'draft',
  rejection_reason text,
  views_count bigint not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videos_channel_slug_unique unique (channel_id, slug)
);

create index videos_channel_idx on public.videos (channel_id);
create index videos_category_idx on public.videos (category_id);
create index videos_status_idx on public.videos (status);
create index videos_published_at_idx on public.videos (published_at desc);

-- ---------------------------------------------------------------------
-- subscriptions — usuario segue um canal
-- ---------------------------------------------------------------------
create table public.subscriptions (
  subscriber_id uuid not null references public.profiles (id) on delete cascade,
  channel_id uuid not null references public.channels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (subscriber_id, channel_id)
);

create index subscriptions_channel_idx on public.subscriptions (channel_id);

-- ---------------------------------------------------------------------
-- comments (auto-referencia para respostas em thread)
-- ---------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_not_empty check (char_length(btrim(content)) > 0)
);

create index comments_video_idx on public.comments (video_id);
create index comments_parent_idx on public.comments (parent_id);

-- ---------------------------------------------------------------------
-- playlists
-- ---------------------------------------------------------------------
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.playlist_videos (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (playlist_id, video_id)
);

-- ---------------------------------------------------------------------
-- video_progress — historico/continuar assistindo
-- ---------------------------------------------------------------------
create table public.video_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  seconds_watched integer not null default 0,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, read_at);

-- ---------------------------------------------------------------------
-- updated_at trigger generico
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.channels
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.videos
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.playlists
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- cria profile automaticamente ao registrar um usuario no auth.users
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Novo usuario')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- incrementa views_count de forma atomica (evita race condition de
-- "read-then-write" quando muitos usuarios assistem ao mesmo tempo)
-- ---------------------------------------------------------------------
create function public.increment_video_views(video_id_input uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.videos set views_count = views_count + 1 where id = video_id_input;
$$;
