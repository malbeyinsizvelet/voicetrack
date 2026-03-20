// ============================================================
// AUTH CONTEXT — Phase 13
// Login / Logout / Session yönetimi.
// authService üzerindeki tüm auth işlemleri buradan geçer.
// Gerçek sistemde token refresh, interceptor vb. buraya eklenir.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { LoginCredentials, User } from '../types';
import { authService } from '../services/authService';

// ─── Context Shape ────────────────────────────────────────────

interface AuthContextValue {
  /** Giriş yapmış kullanıcı. Null ise oturum yok. */
  currentUser: User | null;
  /** İlk session kontrolü devam ediyor mu? */
  isLoading: boolean;
  /** Kullanıcı giriş yapmış mı? */
  isAuthenticated: boolean;
  /** Oturum açma — hata fırlatır, yakalamak çağıran bileşenin sorumluluğu */
  login: (credentials: LoginCredentials) => Promise<void>;
  /** Oturumu sonlandır */
  logout: () => Promise<void>;
}

// ─── Context + Hook ───────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Uygulama açıldığında storage'daki session'ı senkron kontrol et
  useEffect(() => {
    try {
      // getSession artık sync — storage abstraction kullanıyor
      const session = authService.getSession();
      setCurrentUser(session?.user ?? null);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const user = await authService.login(credentials);
    setCurrentUser(user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
  }, []);

  const value: AuthContextValue = {
    currentUser,
    isLoading,
    isAuthenticated: currentUser !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
