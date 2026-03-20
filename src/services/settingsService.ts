// ============================================================
// SETTINGS SERVICE — Supabase + localStorage fallback
// ============================================================

import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { createLogger } from '../lib/logger';
import type { AppSettings } from '../types';

const log = createLogger('SettingsService');
const LOCAL_KEY = 'vt_settings';

// ─── localStorage yardımcıları (her zaman çalışır) ───────────
export function loadSettingsFromLocal(): AppSettings | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as AppSettings) : null;
  } catch { return null; }
}

export function saveSettingsToLocal(settings: AppSettings): void {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(settings)); }
  catch { /* quota */ }
}

export function clearLocalSettings(): void {
  localStorage.removeItem(LOCAL_KEY);
}

// ─── Supabase implementasyonu ─────────────────────────────────
async function supabaseLoadSettings(userId: string): Promise<AppSettings | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('app_settings')
    .select('settings_json')
    .eq('user_id', userId)
    .eq('scope', 'user')
    .single();

  if (error || !data) return null;
  return data.settings_json as AppSettings;
}

async function supabaseSaveSettings(userId: string, settings: AppSettings): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db
    .from('app_settings')
    .upsert(
      {
        user_id: userId,
        scope: 'user',
        settings_json: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,scope' }
    );

  if (error) log.warn('supabaseSaveSettings failed', { error: error.message });
}

// ─── Public API ───────────────────────────────────────────────
export const settingsService = {
  /**
   * Ayarları yükle.
   * Supabase varsa → DB'den + local cache.
   * Yoksa → sadece localStorage.
   */
  async load(userId?: string): Promise<AppSettings | null> {
    if (isSupabaseEnabled() && userId) {
      try {
        const dbSettings = await supabaseLoadSettings(userId);
        if (dbSettings) {
          // Lokal cache'e de yaz (hızlı startup için)
          saveSettingsToLocal(dbSettings);
          return dbSettings;
        }
      } catch (err) {
        log.warn('DB settings load failed, using local', { err });
      }
    }
    return loadSettingsFromLocal();
  },

  /**
   * Ayarları kaydet.
   * Supabase varsa → DB + local cache.
   * Yoksa → sadece localStorage.
   */
  async save(settings: AppSettings, userId?: string): Promise<void> {
    // Her zaman lokal'e yaz (hızlı erişim + fallback)
    saveSettingsToLocal(settings);

    if (isSupabaseEnabled() && userId) {
      try {
        await supabaseSaveSettings(userId, settings);
      } catch (err) {
        log.warn('DB settings save failed, only local saved', { err });
      }
    }
  },

  clear(): void {
    clearLocalSettings();
  },
};
