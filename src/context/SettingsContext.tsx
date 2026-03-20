// ============================================================
// SETTINGS CONTEXT — Supabase + localStorage fallback
// ============================================================
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { AppSettings } from '../types';
import { settingsService } from '../services/settingsService';

const STORAGE_KEY = 'vt_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    defaultLanguage: 'tr',
    dateFormat: 'DD/MM/YYYY',
    defaultTheme: 'dark',
    defaultLandingPage: 'dashboard',
  },
  files: {
    allowedFormats: ['wav', 'mp3', 'flac', 'aiff'],
    maxFileSizeMB: 500,
    sourceFolder: '/projects/{id}/source/',
    recordedFolder: '/projects/{id}/recorded/',
    autoNameFromFileName: true,
  },
  qc: {
    qcRequired: true,
    revisionNoteRequired: true,
    showQCNotesToArtist: true,
    autoStatusOnApprove: 'qc_approved',
    autoStatusOnReject: 'qc_rejected',
  },
  permissions: {
    roleModuleAccess: {
      admin: ['dashboard', 'projects', 'qc', 'settings', 'users'],
      project_manager: ['dashboard', 'projects', 'qc'],
      voice_artist: ['dashboard', 'my-tasks'],
      qc_reviewer: ['dashboard', 'qc'],
    },
  },
};

function loadLocalSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    return {
      general: { ...DEFAULT_SETTINGS.general, ...(saved.general ?? {}) },
      files: { ...DEFAULT_SETTINGS.files, ...(saved.files ?? {}) },
      qc: { ...DEFAULT_SETTINGS.qc, ...(saved.qc ?? {}) },
      permissions: { ...DEFAULT_SETTINGS.permissions, ...(saved.permissions ?? {}) },
    };
  } catch { return DEFAULT_SETTINGS; }
}

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  updateGeneralSettings: (data: Partial<AppSettings['general']>) => void;
  updateFileSettings: (data: Partial<AppSettings['files']>) => void;
  updateQCSettings: (data: Partial<AppSettings['qc']>) => void;
  resetSettings: () => void;
  /** Supabase'den kullanıcı ayarlarını yükler (login sonrası çağrılır) */
  loadUserSettings: (userId: string) => Promise<void>;
  /** Supabase'e kullanıcı ayarlarını kaydeder */
  saveUserSettings: (userId: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadLocalSettings);
  const [isLoading, setIsLoading] = useState(false);

  const set = useCallback(
    (updater: (prev: AppSettings) => AppSettings, userId?: string) => {
      setSettings((prev) => {
        const next = updater(prev);
        // Her zaman lokal'e kaydet
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
        // Supabase'e arka planda kaydet
        if (userId) {
          settingsService.save(next, userId).catch(() => {});
        }
        return next;
      });
    },
    []
  );

  const updateGeneralSettings = useCallback(
    (data: Partial<AppSettings['general']>) =>
      set((prev) => ({ ...prev, general: { ...prev.general, ...data } })),
    [set]
  );

  const updateFileSettings = useCallback(
    (data: Partial<AppSettings['files']>) =>
      set((prev) => ({ ...prev, files: { ...prev.files, ...data } })),
    [set]
  );

  const updateQCSettings = useCallback(
    (data: Partial<AppSettings['qc']>) =>
      set((prev) => ({ ...prev, qc: { ...prev.qc, ...data } })),
    [set]
  );

  const resetSettings = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS)); } catch {}
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const loadUserSettings = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const loaded = await settingsService.load(userId);
      if (loaded) {
        setSettings({
          general: { ...DEFAULT_SETTINGS.general, ...(loaded.general ?? {}) },
          files: { ...DEFAULT_SETTINGS.files, ...(loaded.files ?? {}) },
          qc: { ...DEFAULT_SETTINGS.qc, ...(loaded.qc ?? {}) },
          permissions: { ...DEFAULT_SETTINGS.permissions, ...(loaded.permissions ?? {}) },
        });
      }
    } catch {
      // Sessizce başarısız ol, mevcut ayarlar korunur
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSettings = useCallback(async (userId: string) => {
    await settingsService.save(settings, userId);
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      updateGeneralSettings,
      updateFileSettings,
      updateQCSettings,
      resetSettings,
      loadUserSettings,
      saveUserSettings,
    }),
    [settings, isLoading, updateGeneralSettings, updateFileSettings, updateQCSettings, resetSettings, loadUserSettings, saveUserSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within <SettingsProvider>');
  return ctx;
}
