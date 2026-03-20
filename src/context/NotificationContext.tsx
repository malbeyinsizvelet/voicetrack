// ============================================================
// NOTIFICATION CONTEXT — Supabase + localStorage fallback
// ============================================================
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { isSupabaseEnabled } from '../lib/supabase';
import { notificationService } from '../services/notificationService';

export type NotificationType =
  | 'qc_approved'
  | 'qc_rejected'
  | 'artist_uploaded'
  | 'info'
  | 'error';

export type NotificationTargetRole =
  | 'voice_artist'
  | 'qc_reviewer'
  | 'project_manager'
  | 'admin'
  | 'all';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targetRole: NotificationTargetRole;
  meta?: {
    projectId?: string;
    projectName?: string;
    characterName?: string;
    lineNumber?: number;
    artistName?: string;
  };
  read: boolean;
  createdAt: string;
}

export interface NotifyPayload {
  type: NotificationType;
  title: string;
  body: string;
  targetRole: NotificationTargetRole;
  meta?: AppNotification['meta'];
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  notify: (payload: NotifyPayload) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const MAX_NOTIFICATIONS = 50;

// ─── localStorage yardımcıları (fallback) ────────────────────
function storageKey(userId: string) { return `vt_notif_${userId}`; }

function loadFromLocal(userId: string): AppNotification[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch { return []; }
}

function saveToLocal(userId: string, items: AppNotification[]) {
  if (!userId) return;
  try { localStorage.setItem(storageKey(userId), JSON.stringify(items)); }
  catch { /* quota */ }
}

function genLocalId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface Props { children: ReactNode; userId: string; }

export function NotificationProvider({ children, userId }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const prevUserId = useRef(userId);

  // Kullanıcı değişince bildirimleri yeniden yükle
  useEffect(() => {
    if (!userId) { setNotifications([]); return; }

    if (isSupabaseEnabled()) {
      // Supabase'den yükle
      notificationService.loadForUser(userId).then((items) => {
        setNotifications(items);
      }).catch(() => {
        // Fallback: localStorage
        setNotifications(loadFromLocal(userId));
      });
    } else {
      // localStorage fallback
      if (prevUserId.current !== userId) {
        setNotifications(loadFromLocal(userId));
        prevUserId.current = userId;
      } else {
        setNotifications(loadFromLocal(userId));
      }
    }
  }, [userId]);

  // localStorage'a otomatik kaydet (Supabase kapalıyken)
  useEffect(() => {
    if (!isSupabaseEnabled() && userId) {
      saveToLocal(userId, notifications);
    }
  }, [notifications, userId]);

  const notify = useCallback((payload: NotifyPayload) => {
    if (isSupabaseEnabled() && userId) {
      // Supabase'e ekle, sonra local state'i güncelle
      notificationService.add(userId, payload).then((saved) => {
        if (saved) {
          setNotifications((prev) => [saved, ...prev].slice(0, MAX_NOTIFICATIONS));
        }
      }).catch(() => {
        // Fallback: local optimistic
        const item: AppNotification = {
          id: genLocalId(),
          ...payload,
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [item, ...prev].slice(0, MAX_NOTIFICATIONS));
      });
    } else {
      // localStorage fallback
      const item: AppNotification = {
        id: genLocalId(),
        ...payload,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [item, ...prev].slice(0, MAX_NOTIFICATIONS));
    }
  }, [userId]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (isSupabaseEnabled()) {
      notificationService.markRead(id).catch(() => {});
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (isSupabaseEnabled() && userId) {
      notificationService.markAllRead(userId).catch(() => {});
    }
  }, [userId]);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (isSupabaseEnabled()) {
      notificationService.remove(id).catch(() => {});
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (isSupabaseEnabled() && userId) {
      notificationService.clearAll(userId).catch(() => {});
    } else if (userId) {
      localStorage.removeItem(storageKey(userId));
    }
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, notify, markRead, markAllRead, remove, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
