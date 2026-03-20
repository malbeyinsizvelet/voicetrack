import React, {
  createContext, useContext, useState, useCallback, useMemo,
} from 'react';
import type { AppSettings } from '../types';

const STORAGE_KEY = 'vt_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    defaultLanguage:     'tr',
    dateFormat:          'DD/MM/YYYY',
    defaultTheme:        'dark',
    defaultLandingPage:  'dashboard',
  },
  files: {
    allowedFormats:       ['wav', 'mp3', 'flac', 'aiff'],
    maxFileSizeMB:        500,
    sourceFolder:         '/projects/{id}/source/',
    recordedFolder:       '/projects/{id}/recorded/',
    autoNameFromFileName: true,
  },
  qc: {
    qcRequired:            true,
    revisionNoteRequired:  true,
    showQCNotesToArtist:   true,
    autoStatusOnApprove:   'qc_approved',
    autoStatusOnReject:    'qc_rejected',
  },
  permissions: {
    roleModuleAccess: {
      admin:           ['dashboard', 'projects', 'qc', 'settings', 'users'],
      project_manager: ['dashboard', 'projects', 'qc'],
      voice_artist:    ['dashboard', 'my-tasks'],
      qc_reviewer:     ['dashboard', 'qc'],
    },
  },
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    return {
      general:     { ...DEFAULT_SETTINGS.general,     ...(saved.general     ?? {}) },
      files:       { ...DEFAULT_SETTINGS.files,       ...(saved.files       ?? {}) },
      qc:          { ...DEFAULT_SETTINGS.qc,          ...(saved.qc          ?? {}) },
      permissions: { ...DEFAULT_SETTINGS.permissions, ...(saved.permissions ?? {}) },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persist(s: AppSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

interface SettingsContextValue {
  settings:               AppSettings;
  updateGeneralSettings:  (data: Partial<AppSettings['general']>) => void;
  updateFileSettings:     (data: Partial<AppSettings['files']>)   => void;
  updateQCSettings:       (data: Partial<AppSettings['qc']>)      => void;
  resetSettings:          () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const set = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, []);

  const updateGeneralSettings = useCallback((data: Partial<AppSettings['general']>) => {
    set((prev) => ({ ...prev, general: { ...prev.general, ...data } }));
  }, [set]);

  const updateFileSettings = useCallback((data: Partial<AppSettings['files']>) => {
    set((prev) => ({ ...prev, files: { ...prev.files, ...data } }));
  }, [set]);

  const updateQCSettings = useCallback((data: Partial<AppSettings['qc']>) => {
    set((prev) => ({ ...prev, qc: { ...prev.qc, ...data } }));
  }, [set]);

  const resetSettings = useCallback(() => {
    persist(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateGeneralSettings,
      updateFileSettings,
      updateQCSettings,
      resetSettings,
    }),
    [settings, updateGeneralSettings, updateFileSettings, updateQCSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
