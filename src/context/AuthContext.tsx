// ============================================================
// AUTH CONTEXT — Supabase + Mock Fallback
// ============================================================
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { LoginCredentials, User } from '../types';
import { authService } from '../services/authService';
import { isSupabaseEnabled } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// Maksimum loading süresi
const MAX_LOADING_MS = 6000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedRef = useRef(false);

  // Bir kez çözümlendikten sonra isLoading=false yap
  const resolve = useCallback((user: User | null) => {
    if (resolvedRef.current) {
      // Zaten çözümlendiyse sadece user'ı güncelle (rol değişikliği vs.)
      setCurrentUser(user);
      return;
    }
    resolvedRef.current = true;
    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  // ─── Supabase modu ────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled()) return;

    let cancelled = false;

    // Güvenlik timeout — ne olursa olsun 6sn'de loading kapanır
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        console.warn('[AuthContext] Safety timeout triggered');
        resolve(null);
      }
    }, MAX_LOADING_MS);

    // Supabase auth state listener
    // Bu hem INITIAL_SESSION hem sonraki değişiklikleri yakalar
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return;

        console.debug('[AuthContext] auth event:', event, 'uid:', session?.user?.id);

        if (!session?.user) {
          clearTimeout(safetyTimer);
          resolve(null);
          return;
        }

        // Profili çek
        try {
          const user = await authService.getCurrentUserAsync();
          if (!cancelled) {
            clearTimeout(safetyTimer);
            resolve(user);
          }
        } catch (err) {
          console.error('[AuthContext] Profile fetch error:', err);
          if (!cancelled) {
            clearTimeout(safetyTimer);
            resolve(null);
          }
        }
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Mock modu ────────────────────────────────────────────
  useEffect(() => {
    if (isSupabaseEnabled()) return;

    const init = async () => {
      try {
        const user = await authService.getCurrentUserAsync();
        resolve(user);
      } catch {
        resolve(null);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Login ────────────────────────────────────────────────
  // Supabase modunda: signInWithPassword → onAuthStateChange tetikler → user set edilir
  // Mock modunda: doğrudan user döner
  const login = useCallback(async (credentials: LoginCredentials) => {
    if (isSupabaseEnabled()) {
      // Supabase login yaptık; onAuthStateChange listener otomatik user'ı set eder.
      // Ama login sayfasından yönlendirme için user'ı hemen set etmemiz lazım.
      const user = await authService.login(credentials);
      setCurrentUser(user);
    } else {
      const user = await authService.login(credentials);
      setCurrentUser(user);
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    resolvedRef.current = false; // sonraki login için sıfırla
    setCurrentUser(null);
    // Supabase modunda onAuthStateChange null döner zaten
  }, []);

  // ─── Refresh (rol değişikliği sonrası manuel yenile) ─────
  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = await authService.getCurrentUserAsync();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: currentUser !== null,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
