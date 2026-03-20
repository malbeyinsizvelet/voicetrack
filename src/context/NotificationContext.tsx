// ============================================================
// NOTIFICATION CONTEXT — Phase 6
// Kullanıcı bazlı localStorage key: vt_notif_{userId}
// Farklı hesaplar birbirinin bildirimini görmez.
// unread/read mantığı: sadece aktif kullanıcı bazlı.
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

// ─── Tipler ──────────────────────────────────────────────────

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

// ─── Context ─────────────────────────────────────────────────

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

function storageKey(userId: string) {
  return `vt_notif_${userId}`;
}

function loadFromStorage(userId: string): AppNotification[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(userId: string, items: AppNotification[]) {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  } catch {
    // quota aşımı — sessizce geç
  }
}

// ─── Provider ────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Aktif kullanıcı ID'si — AuthContext'ten gelir */
  userId: string;
}

export function NotificationProvider({ children, userId }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadFromStorage(userId)
  );

  // Kullanıcı değişince doğru veriyi yükle + eski kullanıcı verisini temizle
  const prevUserId = useRef(userId);
  useEffect(() => {
    if (prevUserId.current !== userId) {
      prevUserId.current = userId;
      setNotifications(loadFromStorage(userId));
    }
  }, [userId]);

  // State değişince localStorage'a yaz (kullanıcıya özel key)
  useEffect(() => {
    saveToStorage(userId, notifications);
  }, [userId, notifications]);

  const notify = useCallback((payload: NotifyPayload) => {
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      targetRole: payload.targetRole,
      meta: payload.meta,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    if (userId) localStorage.removeItem(storageKey(userId));
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

// ─── Hook ────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
