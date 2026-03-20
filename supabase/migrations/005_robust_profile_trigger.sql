-- ============================================================
-- VoiceTrack — Migration 005: Robust Profile Trigger
-- Bu dosyayı SQL Editor'da çalıştır.
-- ============================================================

-- ─── 1. Trigger fonksiyonunu güçlendir ───────────────────────
-- full_name, name, display_name, email prefix — hangisi varsa al.
-- name sütunu NOT NULL olduğu için mutlaka bir değer üretiyoruz.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  user_role text;
  user_name text;
BEGIN
  -- Rol: metadata'dan al, yoksa voice_artist
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'voice_artist'
  );

  -- İsim: Supabase Dashboard "full_name" doldurur,
  -- programatik kayıtta "name" kullanılıyor olabilir.
  -- Her ikisini de dene, son çare email prefix'i al.
  user_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- role değeri geçerli değilse zorla voice_artist yap
  IF user_role NOT IN ('admin', 'project_manager', 'voice_artist', 'qc_reviewer') THEN
    user_role := 'voice_artist';
  END IF;

  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, user_name, NEW.email, user_role)
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- ─── 2. Trigger'ı yeniden kur ────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 3. Eksik profilleri geri doldur ─────────────────────────
-- Eğer daha önce trigger çalışmadıysa ve profiles'da kayıt yoksa
-- mevcut auth.users'dan oluştur.
INSERT INTO public.profiles (id, name, email, role)
SELECT
  u.id,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(u.email, '@', 1)
  ),
  u.email,
  COALESCE(
    CASE
      WHEN (u.raw_user_meta_data->>'role') IN ('admin','project_manager','voice_artist','qc_reviewer')
      THEN u.raw_user_meta_data->>'role'
    END,
    'voice_artist'
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ─── 4. RLS: profiles tablosunda admin okuma iznini garantile ─
-- Admin kendi profilini ve başkalarını görebilmeli.
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (
    -- kendi profilin
    auth.uid() = id
    OR
    -- veya admin/PM rolündeysen herkesi görebilirsin
    EXISTS (
      SELECT 1 FROM public.profiles self
      WHERE self.id = auth.uid()
        AND self.role IN ('admin', 'project_manager')
    )
  );

-- ─── 5. projects tablosu için de aynı şekilde ────────────────
DROP POLICY IF EXISTS "projects_authenticated_read" ON public.projects;
CREATE POLICY "projects_authenticated_read"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);  -- tüm authenticated kullanıcılar okuyabilir

DROP POLICY IF EXISTS "projects_admin_pm_write" ON public.projects;
CREATE POLICY "projects_admin_pm_write"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'project_manager')
    )
  );

-- ─── 6. Kontrol sorgusu ──────────────────────────────────────
-- Çalıştırdıktan sonra şunu çalıştırıp kendi profilinin gelip gelmediğini kontrol et:
-- SELECT * FROM public.profiles;

-- ─── 7. Rol güncelleme kısayolu ──────────────────────────────
-- Kendi rolünü admin yapmak için:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'senin@emailin.com';
