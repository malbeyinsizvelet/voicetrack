-- ============================================================
-- Migration 004: Profile kurtarma + sütun esnekliği
-- Bu migration'ı çalıştırınca:
--   1. "name" sütunu korunur (full_name alias eklenir)
--   2. Silinen profilleri kurtaran fonksiyon eklenir
--   3. Profil yoksa login sonrası otomatik oluşturur
-- ============================================================

-- ─── full_name sütununu name'in alias'ı olarak ekle ─────────
-- (ChatGPT'nin önerdiği full_name değişikliğini geri almak yerine
--  her ikisini de destekliyoruz)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'full_name'
  ) THEN
    -- full_name yoksa name'in computed alias'ını ekle
    ALTER TABLE public.profiles ADD COLUMN full_name text GENERATED ALWAYS AS (name) STORED;
  END IF;
END $$;

-- ─── Profil kurtarma fonksiyonu ─────────────────────────────
-- Eğer bir kullanıcının profil satırı silinmişse, login sonrası
-- bu fonksiyon çağrılarak profil yeniden oluşturulabilir.
CREATE OR REPLACE FUNCTION public.ensure_profile_exists(
  p_id        uuid,
  p_email     text,
  p_name      text DEFAULT NULL,
  p_role      text DEFAULT 'voice_artist'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    p_id,
    p_email,
    COALESCE(p_name, split_part(p_email, '@', 1)),
    p_role
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- ─── Auth trigger'ı güçlendir ────────────────────────────────
-- Yeni kullanıcı oluşturulduğunda profil garantili oluşsun
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Kullanıcı'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'voice_artist'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger zaten varsa drop edip yeniden oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Mevcut auth.users için eksik profilleri doldur ──────────
-- Bu sorgu: auth.users'da var ama profiles'da olmayan kullanıcıları ekler
INSERT INTO public.profiles (id, email, name, role)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1),
    'Kullanıcı'
  ),
  COALESCE(
    u.raw_user_meta_data->>'role',
    'voice_artist'
  )
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ─── Kendi rolünü admin yapmak için ─────────────────────────
-- Aşağıdaki satırı kendi email adresinle çalıştır:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'senin@emailin.com';
