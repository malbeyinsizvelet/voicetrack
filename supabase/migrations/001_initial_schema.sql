-- ============================================================
-- VoiceTrack — Supabase Initial Migration
-- Sırasıyla çalıştır: 001 → 002 → 003
-- Bu dosya: temel tablolar + RLS politikaları
-- ============================================================

-- ─── UUID Extension ──────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles (auth.users ile 1:1 ilişki) ───────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null default 'voice_artist'
                check (role in ('admin','project_manager','voice_artist','qc_reviewer')),
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── Projects ────────────────────────────────────────────────
create table if not exists public.projects (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  client_name   text not null,
  description   text,
  status        text not null default 'active'
                  check (status in ('active','completed','on_hold','archived')),
  manager_id    uuid references public.profiles(id) on delete set null,
  manager_name  text not null,
  due_date      date,
  cover_color   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Characters ──────────────────────────────────────────────
create table if not exists public.characters (
  id                    uuid primary key default uuid_generate_v4(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  name                  text not null,
  description           text,
  voice_notes           text,
  gender                text check (gender in ('male','female','neutral','unknown')),
  priority              text check (priority in ('critical','high','normal','low')),
  assigned_artist_id    uuid references public.profiles(id) on delete set null,
  assigned_artist_name  text,
  line_count            integer not null default 0,
  completed_count       integer not null default 0,
  "order"               integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Tasks ───────────────────────────────────────────────────
create table if not exists public.tasks (
  id                    uuid primary key default uuid_generate_v4(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  character_id          uuid not null references public.characters(id) on delete cascade,
  character_name        text not null,
  assigned_to           uuid references public.profiles(id) on delete set null,
  assigned_artist_name  text,
  line_count            integer not null default 0,
  status                text not null default 'pending'
                          check (status in ('pending','in_progress','uploaded','qc_approved','qc_rejected','mixed','final')),
  notes                 text,
  due_date              date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ─── Recording Lines ─────────────────────────────────────────
create table if not exists public.recording_lines (
  id               uuid primary key default uuid_generate_v4(),
  task_id          uuid not null references public.tasks(id) on delete cascade,
  line_number      integer not null,
  original_text    text,
  translated_text  text,
  timecode         text,
  status           text not null default 'pending'
                     check (status in ('pending','recorded','approved','rejected','retake')),
  director_note    text,
  artist_note      text,
  qc_note          text,
  reviewed_by      uuid references public.profiles(id) on delete set null,
  reviewed_at      timestamptz,
  retake_count     integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (task_id, line_number)
);

-- ─── Audio Files (HF metadata) ───────────────────────────────
-- Binary dosyalar Hugging Face'te. Burada sadece metadata.
create table if not exists public.audio_files (
  id                uuid primary key default uuid_generate_v4(),
  task_id           uuid not null references public.tasks(id) on delete cascade,
  line_id           uuid references public.recording_lines(id) on delete cascade,
  type              text not null check (type in ('source','recorded','mixed','final')),
  file_name         text not null,
  file_size         bigint not null default 0,
  mime_type         text,
  duration          numeric,           -- saniye
  hf_path           text not null,     -- HF repo içindeki göreli yol
  hf_url            text not null,     -- tam erişim URL'i
  storage_provider  text not null default 'huggingface',
  version_number    integer,
  uploaded_by       uuid references public.profiles(id) on delete set null,
  uploaded_at       timestamptz not null default now()
);

-- ─── Recording Versions ──────────────────────────────────────
create table if not exists public.recording_versions (
  id             uuid primary key default uuid_generate_v4(),
  line_id        uuid not null references public.recording_lines(id) on delete cascade,
  version        integer not null,
  audio_file_id  uuid not null references public.audio_files(id) on delete cascade,
  uploaded_at    timestamptz not null default now(),
  uploaded_by    uuid references public.profiles(id) on delete set null,
  qc_status      text check (qc_status in ('pending','approved','rejected')),
  qc_note        text,
  reviewed_by    uuid references public.profiles(id) on delete set null,
  reviewed_at    timestamptz,
  unique (line_id, version)
);

-- ─── QC Reviews ──────────────────────────────────────────────
create table if not exists public.qc_reviews (
  id                    uuid primary key default uuid_generate_v4(),
  project_id            uuid not null references public.projects(id) on delete cascade,
  task_id               uuid not null references public.tasks(id) on delete cascade,
  line_id               uuid not null references public.recording_lines(id) on delete cascade,
  recording_version_id  uuid references public.recording_versions(id) on delete set null,
  reviewer_id           uuid not null references public.profiles(id) on delete cascade,
  reviewer_name         text not null,
  decision              text not null check (decision in ('approved','rejected')),
  note                  text,
  reviewed_at           timestamptz not null default now()
);

-- ─── Notifications ───────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  type         text not null,
  title        text not null,
  body         text not null,
  target_role  text not null,
  meta         jsonb,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── App Settings ────────────────────────────────────────────
create table if not exists public.app_settings (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references public.profiles(id) on delete cascade,
  scope          text not null default 'user' check (scope in ('global','user')),
  settings_json  jsonb not null default '{}',
  updated_at     timestamptz not null default now(),
  unique (user_id, scope)
);

-- ─── updated_at otomatik güncelleme trigger ───────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger trg_characters_updated_at
  before update on public.characters
  for each row execute procedure public.handle_updated_at();

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

create trigger trg_recording_lines_updated_at
  before update on public.recording_lines
  for each row execute procedure public.handle_updated_at();

create trigger trg_app_settings_updated_at
  before update on public.app_settings
  for each row execute procedure public.handle_updated_at();
