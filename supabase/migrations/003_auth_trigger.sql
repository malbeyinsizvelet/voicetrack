-- ============================================================
-- VoiceTrack — Auth Trigger
-- Sırasıyla çalıştır: 001 → 002 → 003
-- Bu dosya: yeni kullanıcı kaydında otomatik profil oluşturma
-- ============================================================

-- Yeni auth.users kaydında profil oluştur
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  user_role text;
  user_name text;
begin
  -- metadata'dan rol ve isim al (kayıt sırasında options.data ile geçilebilir)
  user_role := coalesce(
    new.raw_user_meta_data->>'role',
    'voice_artist'
  );
  user_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, name, email, role)
  values (new.id, user_name, new.email, user_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger: auth.users INSERT → profil oluştur
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Demo / Seed Notlar ──────────────────────────────────────
-- İlk admin kullanıcısını Supabase Dashboard → Authentication → Users
-- üzerinden manuel oluşturun. Kayıt sırasında şu metadata'yı girin:
--
-- Additional Metadata (JSON):
-- { "name": "Admin Kullanıcı", "role": "admin" }
--
-- Ya da SQL ile mevcut kullanıcının rolünü değiştirin:
-- update public.profiles set role = 'admin' where email = 'your@email.com';
