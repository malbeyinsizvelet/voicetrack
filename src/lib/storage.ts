import { createLogger } from './logger';

const log = createLogger('Storage');

export interface StorageDriver {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

function createLocalStorageDriver(): StorageDriver {
  return {
    get<T>(key: string): T | null {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
      } catch (err) {
        log.warn(`get(${key}) parse hatası`, err);
        return null;
      }
    },
    set<T>(key: string, value: T): void {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (err) { log.error(`set(${key}) yazma hatası`, err); }
    },
    remove(key: string): void {
      try { localStorage.removeItem(key); }
      catch (err) { log.warn(`remove(${key}) hatası`, err); }
    },
    clear(): void {
      try { localStorage.clear(); }
      catch (err) { log.error('clear() hatası', err); }
    },
    has(key: string): boolean { return localStorage.getItem(key) !== null; },
  };
}

function createMemoryDriver(): StorageDriver {
  const store = new Map<string, string>();
  return {
    get<T>(key: string): T | null {
      const raw = store.get(key);
      if (!raw) return null;
      try { return JSON.parse(raw) as T; } catch { return null; }
    },
    set<T>(key: string, value: T): void { store.set(key, JSON.stringify(value)); },
    remove(key: string): void { store.delete(key); },
    clear(): void { store.clear(); },
    has(key: string): boolean { return store.has(key); },
  };
}

function resolveDriver(): StorageDriver {
  try {
    localStorage.setItem('__vt_test__', '1');
    localStorage.removeItem('__vt_test__');
    return createLocalStorageDriver();
  } catch {
    log.warn('localStorage kullanılamıyor, memory driver kullanılıyor');
    return createMemoryDriver();
  }
}

export const storage = resolveDriver();

export const SESSION_KEY = 'vt_session';
export const PREFERENCES_KEY = 'vt_preferences';
export const DRAFT_KEY_PREFIX = 'vt_draft_';
