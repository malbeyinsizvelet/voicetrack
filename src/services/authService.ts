// ============================================================
// AUTH SERVICE — Supabase + Mock Fallback
//
// Supabase yapılandırılmışsa → Supabase Auth kullanılır.
// Yapılandırılmamışsa (geliştirme/demo) → mock fallback devreye girer.
// ============================================================

import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { MOCK_USERS, MOCK_CREDENTIALS } from '../mock';
import type { User, AuthSession, LoginCredentials } from '../types';
import { storage, SESSION_KEY } from '../lib/storage';
import { createLogger } from '../lib/logger';
import { UnauthorizedError, NotFoundError } from '../lib/errors';
import { SESSION_DURATION_MS } from '../constants';

const log = createLogger('AuthService');

// ─── Supabase profile → app User dönüşümü ────────────────────
// NOT: Supabase'de sütun adı "name" VEYA "full_name" olabilir,
// ikisini de destekliyoruz. Email yoksa auth.users'dan alınan
// email_hint ile fallback yapıyoruz.
function profileToUser(profile: Record<string, unknown>, emailHint?: string): User {
  // full_name veya name sütununu destekle
  const name =
    (profile['full_name'] as string | undefined) ||
    (profile['name'] as string | undefined) ||
    (emailHint ?? 'Kullanıcı');

  const email =
    (profile['email'] as string | undefined) ||
    emailHint ||
    '';

  const role = (profile['role'] as string | undefined) || 'voice_artist';

  return {
    id: profile['id'] as string,
    name,
    email,
    role: role as User['role'],
    avatarUrl: (profile['avatar_url'] as string | undefined) ?? undefined,
    createdAt: (profile['created_at'] as string | undefined) ?? new Date().toISOString(),
  };
}

// ─── Mock yardımcıları (fallback) ─────────────────────────────
function buildMockSession(user: User): AuthSession {
  return {
    user,
    token: `mock-token-${user.id}-${Date.now()}`,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  };
}

function isMockExpired(session: AuthSession): boolean {
  return new Date(session.expiresAt) < new Date();
}

// ─── Supabase Auth ────────────────────────────────────────────
async function supabaseLogin(credentials: LoginCredentials): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    log.warn('Supabase login failed', { error: error.message });
    if (error.message.toLowerCase().includes('invalid')) {
      throw new UnauthorizedError('E-posta veya şifre hatalı.');
    }
    throw new UnauthorizedError(error.message);
  }

  if (!data.user) throw new UnauthorizedError('Kullanıcı verisi alınamadı.');

  // Profil tablosundan rol ve isim bilgisini çek
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    // Profile yoksa → DB'ye otomatik oluştur (trigger çalışmamış veya row silinmiş olabilir)
    log.warn('Profile not found after login, auto-creating profile', { userId: data.user.id });

    const autoName =
      data.user.user_metadata?.['full_name'] ||
      data.user.user_metadata?.['name'] ||
      data.user.email?.split('@')[0] ||
      'Kullanıcı';
    const autoRole =
      (data.user.user_metadata?.['role'] as User['role']) ?? 'voice_artist';

    // Profiles tablosuna yaz — zaten varsa güncelleme yok (on conflict do nothing)
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name: autoName,
      email: data.user.email ?? '',
      role: autoRole,
    }, { onConflict: 'id', ignoreDuplicates: true });

    // Yeniden çek
    const { data: retryProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (retryProfile) {
      const user = profileToUser(retryProfile as Record<string, unknown>, data.user.email);
      log.info('Login success (profile auto-created)', { userId: user.id, role: user.role });
      return user;
    }

    // Hâlâ yoksa minimal fallback
    const fallbackUser: User = {
      id: data.user.id,
      name: autoName,
      email: data.user.email ?? '',
      role: autoRole,
      avatarUrl: data.user.user_metadata?.['avatar_url'] ?? undefined,
      createdAt: data.user.created_at,
    };
    log.info('Login success (profile fallback)', { userId: fallbackUser.id, role: fallbackUser.role });
    return fallbackUser;
  }

  const user = profileToUser(profile as Record<string, unknown>, data.user.email);
  log.info('Supabase login success', { userId: user.id, role: user.role });
  return user;
}

async function supabaseLogout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) log.warn('Supabase logout error', { error: error.message });
  log.info('Supabase logout');
}

async function supabaseGetCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const authUser = session.user;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error || !profile) {
    // Profile yoksa → otomatik oluştur
    log.warn('Profile not found in getCurrentUser, auto-creating', { userId: authUser.id });
    const autoName =
      authUser.user_metadata?.['full_name'] ||
      authUser.user_metadata?.['name'] ||
      authUser.email?.split('@')[0] ||
      'Kullanıcı';
    const autoRole = (authUser.user_metadata?.['role'] as User['role']) ?? 'voice_artist';

    await supabase.from('profiles').upsert({
      id: authUser.id,
      name: autoName,
      email: authUser.email ?? '',
      role: autoRole,
    }, { onConflict: 'id', ignoreDuplicates: true });

    const { data: retryProfile } = await supabase
      .from('profiles').select('*').eq('id', authUser.id).single();

    if (retryProfile) return profileToUser(retryProfile as Record<string, unknown>, authUser.email);

    return {
      id: authUser.id,
      name: autoName,
      email: authUser.email ?? '',
      role: autoRole,
      avatarUrl: authUser.user_metadata?.['avatar_url'] ?? undefined,
      createdAt: authUser.created_at,
    };
  }

  return profileToUser(profile as Record<string, unknown>, authUser.email);
}

// ─── Mock Auth (fallback) ─────────────────────────────────────
async function mockLogin(credentials: LoginCredentials): Promise<User> {
  await new Promise((r) => setTimeout(r, 600));
  const credential = MOCK_CREDENTIALS.find(
    (c) => c.email.toLowerCase() === credentials.email.toLowerCase()
  );
  if (!credential) {
    throw new UnauthorizedError('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
  }
  if (credential.password !== credentials.password) {
    throw new UnauthorizedError('Şifre hatalı. Lütfen tekrar deneyin.');
  }
  const user = MOCK_USERS.find((u) => u.id === credential.userId);
  if (!user) throw new NotFoundError('Kullanıcı verisi');
  const session = buildMockSession(user);
  storage.set<AuthSession>(SESSION_KEY, session);
  log.info('Mock login success', { userId: user.id, role: user.role });
  return user;
}

async function mockLogout(): Promise<void> {
  storage.remove(SESSION_KEY);
  log.info('Mock logout');
}

function mockGetSession(): AuthSession | null {
  const session = storage.get<AuthSession>(SESSION_KEY);
  if (!session) return null;
  if (isMockExpired(session)) {
    storage.remove(SESSION_KEY);
    return null;
  }
  return session;
}

// ─── Public API ───────────────────────────────────────────────
export const authService = {
  /** Giriş yap. Supabase varsa gerçek auth, yoksa mock. */
  async login(credentials: LoginCredentials): Promise<User> {
    if (isSupabaseEnabled()) return supabaseLogin(credentials);
    return mockLogin(credentials);
  },

  /** Çıkış yap. */
  async logout(): Promise<void> {
    if (isSupabaseEnabled()) return supabaseLogout();
    return mockLogout();
  },

  /**
   * Mevcut session'dan kullanıcıyı döner.
   * Supabase modunda async; mock modunda sync wrapper.
   */
  async getCurrentUserAsync(): Promise<User | null> {
    if (isSupabaseEnabled()) return supabaseGetCurrentUser();
    return mockGetSession()?.user ?? null;
  },

  /** Mock uyumluluk — sync session (sadece mock modunda anlamlı) */
  getSession(): AuthSession | null {
    if (isSupabaseEnabled()) {
      // Supabase oturumu sync olarak döndürülemez;
      // AuthContext useEffect içinde getCurrentUserAsync kullanılır.
      return null;
    }
    return mockGetSession();
  },

  getCurrentUser(): User | null {
    return this.getSession()?.user ?? null;
  },

  isAuthenticated(): boolean {
    if (isSupabaseEnabled()) return false; // context'te async kontrol yapılır
    return this.getSession() !== null;
  },

  /**
   * Supabase auth state değişikliklerini dinle.
   * AuthContext bunu kullanarak kullanıcıyı günceller.
   */
  onAuthStateChange(
    callback: (user: User | null) => void
  ): { unsubscribe: () => void } {
    if (!isSupabaseEnabled()) {
      // Mock modda değişiklik yok, boş unsubscribe döner
      return { unsubscribe: () => {} };
    }

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      log.debug('Auth state change', { event, userId: session?.user?.id });

      if (!session?.user) {
        callback(null);
        return;
      }

      const authUser = session.user;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) {
        // Profile bulunamadı → otomatik oluştur, null dönme
        log.warn('onAuthStateChange: profile not found, auto-creating', { userId: authUser.id });

        const autoName =
          authUser.user_metadata?.['full_name'] ||
          authUser.user_metadata?.['name'] ||
          authUser.email?.split('@')[0] ||
          'Kullanıcı';
        const autoRole = (authUser.user_metadata?.['role'] as User['role']) ?? 'voice_artist';

        // DB'ye yaz (zaten varsa ignore)
        await supabase.from('profiles').upsert({
          id: authUser.id,
          name: autoName,
          email: authUser.email ?? '',
          role: autoRole,
        }, { onConflict: 'id', ignoreDuplicates: true });

        // Tekrar çek — bu sefer rol değişikliği de yansır
        const { data: retryProfile } = await supabase
          .from('profiles').select('*').eq('id', authUser.id).single();

        if (retryProfile) {
          callback(profileToUser(retryProfile as Record<string, unknown>, authUser.email));
          return;
        }

        callback({
          id: authUser.id,
          name: autoName,
          email: authUser.email ?? '',
          role: autoRole,
          avatarUrl: authUser.user_metadata?.['avatar_url'] ?? undefined,
          createdAt: authUser.created_at,
        });
        return;
      }

      callback(profileToUser(profile as Record<string, unknown>, authUser.email));
    });

    return { unsubscribe: () => data.subscription.unsubscribe() };
  },

  /**
   * Yeni kullanıcı kaydı (admin/PM tarafından kullanılır).
   * Supabase admin panel üzerinden de yapılabilir.
   */
  async signUp(opts: {
    email: string;
    password: string;
    name: string;
    role: User['role'];
  }): Promise<User> {
    if (!isSupabaseEnabled()) {
      throw new Error('signUp sadece Supabase modunda çalışır.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: opts.email,
      password: opts.password,
      options: {
        data: { name: opts.name, role: opts.role },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Kayıt başarısız.');

    // Trigger profile oluşturacak; kısa bekle
    await new Promise((r) => setTimeout(r, 500));

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) throw new NotFoundError('Profil oluşturulamadı');
    return profileToUser(profile);
  },

  /** Profil tablosundaki tüm kullanıcıları listele (admin için). */
  async listUsers(): Promise<User[]> {
    if (!isSupabaseEnabled()) return MOCK_USERS;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      log.warn('listUsers failed, fallback to mock', { error: error.message });
      return MOCK_USERS;
    }

    return (data ?? []).map((p) => profileToUser(p as Record<string, unknown>));
  },
};
