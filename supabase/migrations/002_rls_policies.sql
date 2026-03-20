-- ============================================================
-- VoiceTrack — RLS Politikaları
-- Sırasıyla çalıştır: 001 → 002 → 003
-- Bu dosya: Row Level Security politikaları
-- ============================================================

-- RLS'yi tüm tablolarda etkinleştir
alter table public.profiles          enable row level security;
alter table public.projects          enable row level security;
alter table public.characters        enable row level security;
alter table public.tasks             enable row level security;
alter table public.recording_lines   enable row level security;
alter table public.audio_files       enable row level security;
alter table public.recording_versions enable row level security;
alter table public.qc_reviews        enable row level security;
alter table public.notifications     enable row level security;
alter table public.app_settings      enable row level security;

-- ─── Yardımcı fonksiyon: mevcut kullanıcı rolünü döner ──────
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ─── Profiles ────────────────────────────────────────────────
-- Herkes kendi profilini okuyabilir; admin/pm herkesi görebilir
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid()
    or public.current_user_role() in ('admin', 'project_manager')
  );

create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_self" on public.profiles
  for update using (
    id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- ─── Projects ────────────────────────────────────────────────
-- Admin/PM her projeyi görür; sanatçılar sadece atandıkları projeleri görür
create policy "projects_select" on public.projects
  for select using (
    public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
    or exists (
      select 1 from public.tasks
      where tasks.project_id = projects.id
        and tasks.assigned_to = auth.uid()
    )
  );

create policy "projects_insert" on public.projects
  for insert with check (
    public.current_user_role() in ('admin', 'project_manager')
  );

create policy "projects_update" on public.projects
  for update using (
    public.current_user_role() in ('admin', 'project_manager')
  );

create policy "projects_delete" on public.projects
  for delete using (
    public.current_user_role() = 'admin'
  );

-- ─── Characters ──────────────────────────────────────────────
create policy "characters_select" on public.characters
  for select using (
    public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
    or assigned_artist_id = auth.uid()
  );

create policy "characters_insert" on public.characters
  for insert with check (
    public.current_user_role() in ('admin', 'project_manager')
  );

create policy "characters_update" on public.characters
  for update using (
    public.current_user_role() in ('admin', 'project_manager')
  );

create policy "characters_delete" on public.characters
  for delete using (
    public.current_user_role() in ('admin', 'project_manager')
  );

-- ─── Tasks ───────────────────────────────────────────────────
create policy "tasks_select" on public.tasks
  for select using (
    public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
    or assigned_to = auth.uid()
  );

create policy "tasks_insert" on public.tasks
  for insert with check (
    public.current_user_role() in ('admin', 'project_manager')
  );

create policy "tasks_update" on public.tasks
  for update using (
    public.current_user_role() in ('admin', 'project_manager')
    or assigned_to = auth.uid()
  );

create policy "tasks_delete" on public.tasks
  for delete using (
    public.current_user_role() in ('admin', 'project_manager')
  );

-- ─── Recording Lines ─────────────────────────────────────────
create policy "recording_lines_select" on public.recording_lines
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = recording_lines.task_id
        and (
          public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
          or t.assigned_to = auth.uid()
        )
    )
  );

create policy "recording_lines_insert" on public.recording_lines
  for insert with check (
    public.current_user_role() in ('admin', 'project_manager')
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assigned_to = auth.uid()
    )
  );

create policy "recording_lines_update" on public.recording_lines
  for update using (
    public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assigned_to = auth.uid()
    )
  );

-- ─── Audio Files ─────────────────────────────────────────────
create policy "audio_files_select" on public.audio_files
  for select using (
    public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
    or exists (
      select 1 from public.tasks t
      where t.id = audio_files.task_id and t.assigned_to = auth.uid()
    )
  );

create policy "audio_files_insert" on public.audio_files
  for insert with check (
    public.current_user_role() in ('admin', 'project_manager')
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assigned_to = auth.uid()
    )
  );

-- ─── Recording Versions ──────────────────────────────────────
create policy "recording_versions_select" on public.recording_versions
  for select using (
    public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
    or exists (
      select 1 from public.recording_lines rl
      join public.tasks t on t.id = rl.task_id
      where rl.id = recording_versions.line_id and t.assigned_to = auth.uid()
    )
  );

create policy "recording_versions_insert" on public.recording_versions
  for insert with check (true); -- servis rolü üzerinden yapılır

create policy "recording_versions_update" on public.recording_versions
  for update using (
    public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
  );

-- ─── QC Reviews ──────────────────────────────────────────────
create policy "qc_reviews_select" on public.qc_reviews
  for select using (
    public.current_user_role() in ('admin', 'project_manager', 'qc_reviewer')
    or exists (
      select 1 from public.tasks t
      where t.id = qc_reviews.task_id and t.assigned_to = auth.uid()
    )
  );

create policy "qc_reviews_insert" on public.qc_reviews
  for insert with check (
    public.current_user_role() in ('admin', 'qc_reviewer')
  );

-- ─── Notifications ───────────────────────────────────────────
create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_insert" on public.notifications
  for insert with check (true); -- sistem tarafından oluşturulur

create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid()); -- sadece read=true yapılabilir

create policy "notifications_delete" on public.notifications
  for delete using (user_id = auth.uid());

-- ─── App Settings ────────────────────────────────────────────
create policy "app_settings_select" on public.app_settings
  for select using (
    user_id = auth.uid()
    or (scope = 'global' and public.current_user_role() in ('admin', 'project_manager'))
  );

create policy "app_settings_upsert" on public.app_settings
  for all using (
    user_id = auth.uid()
    or (scope = 'global' and public.current_user_role() = 'admin')
  );
