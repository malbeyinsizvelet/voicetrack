// ============================================================
// AUTH SERVICE — Phase 13 (Storage abstraction + Logger)
// Session yönetimi storage abstraction üzerinde çalışır.
//
// Gerçek sistemde:
//   login()      → POST /api/auth/login  → JWT token
//   logout()     → POST /api/auth/logout → token invalidate
//   getSession() → token doğrulama / refresh
//   refreshToken() → POST /api/auth/refresh
// ============================================================

import { MOCK_USERS, MOCK_CREDENTIALS } from '../mock';
import type { User, AuthSession, LoginCredentials } from '../types';
import { storage, SESSION_KEY } from '../lib/storage';
import { createLogger } from '../lib/logger';
import { UnauthorizedError, NotFoundError } from '../lib/errors';
import { SESSION_DURATION_MS } from '../constants';

const log = createLogger('AuthService');

// ─── Session helpers ─────────────────────────────────────────

function buildSession(user: User): AuthSession {
  return {
    user,
    token: `mock-token-${user.id}-${Date.now()}`,
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  };
}

function isExpired(session: AuthSession): boolean {
  return new Date(session.expiresAt) < new Date();
}

// ─── Auth Service ─────────────────────────────────────────────

export const authService = {

  /**
   * Email + şifre ile giriş.
   * Gerçek sistemde: POST /api/auth/login
   */
  async login(credentials: LoginCredentials): Promise<User> {
    // Simüle edilmiş ağ gecikmesi
    await new Promise((r) => setTimeout(r, 600));

    const credential = MOCK_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!credential) {
      log.warn('Login failed — email not found', { email: credentials.email });
      throw new UnauthorizedError('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
    }

    if (credential.password !== credentials.password) {
      log.warn('Login failed — wrong password', { email: credentials.email });
      throw new UnauthorizedError('Şifre hatalı. Lütfen tekrar deneyin.');
    }

    const user = MOCK_USERS.find((u) => u.id === credential.userId);
    if (!user) {
      log.error('Login failed — user data missing', { userId: credential.userId });
      throw new NotFoundError('Kullanıcı verisi');
    }

    const session = buildSession(user);
    storage.set<AuthSession>(SESSION_KEY, session);

    log.info('Login success', { userId: user.id, role: user.role });
    return user;
  },

  /**
   * Oturumu sonlandır.
   * Gerçek sistemde: POST /api/auth/logout (token blacklist)
   */
  async logout(): Promise<void> {
    const session = storage.get<AuthSession>(SESSION_KEY);
    if (session) {
      log.info('Logout', { userId: session.user.id });
    }
    storage.remove(SESSION_KEY);
  },

  /**
   * Mevcut session'ı döner.
   * Süresi dolmuşsa null döner ve temizler.
   * Gerçek sistemde: token verify / refresh endpoint'i
   */
  getSession(): AuthSession | null {
    const session = storage.get<AuthSession>(SESSION_KEY);
    if (!session) return null;

    if (isExpired(session)) {
      log.info('Session expired, clearing');
      storage.remove(SESSION_KEY);
      return null;
    }

    return session;
  },

  /**
   * Sadece User döner (session içinden).
   */
  getCurrentUser(): User | null {
    return this.getSession()?.user ?? null;
  },

  /**
   * Token hâlâ geçerli mi?
   */
  isAuthenticated(): boolean {
    return this.getSession() !== null;
  },

  /**
   * Session'ı yenile (expiry uzat).
   * Gerçek sistemde: POST /api/auth/refresh ile yeni token alınır.
   */
  async refreshSession(): Promise<AuthSession | null> {
    const session = this.getSession();
    if (!session) return null;

    const refreshed: AuthSession = {
      ...session,
      token: `mock-token-${session.user.id}-${Date.now()}`,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    };

    storage.set<AuthSession>(SESSION_KEY, refreshed);
    log.debug('Session refreshed', { userId: session.user.id });
    return refreshed;
  },
};
