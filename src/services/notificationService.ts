// ============================================================
// NOTIFICATION SERVICE — Supabase + localStorage fallback
// ============================================================

import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { createLogger } from '../lib/logger';
import type { NotifyPayload, AppNotification } from '../context/NotificationContext';

const log = createLogger('NotificationService');

// ─── Supabase → App type ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToApp(row: any): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    targetRole: row.target_role,
    meta: row.meta ?? undefined,
    read: row.read,
    createdAt: row.created_at,
  };
}

// ─── Supabase implementasyonu ─────────────────────────────────
async function supabaseLoadNotifications(userId: string): Promise<AppNotification[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    log.warn('loadNotifications failed', { error: error.message });
    return [];
  }
  return (data ?? []).map(dbToApp);
}

async function supabaseAddNotification(userId: string, payload: NotifyPayload): Promise<AppNotification | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('notifications')
    .insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      target_role: payload.targetRole,
      meta: payload.meta ?? null,
      read: false,
    })
    .select()
    .single();

  if (error) {
    log.warn('addNotification failed', { error: error.message });
    return null;
  }
  return dbToApp(data);
}

async function supabaseMarkRead(notificationId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) log.warn('markRead failed', { error: error.message });
}

async function supabaseMarkAllRead(userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) log.warn('markAllRead failed', { error: error.message });
}

async function supabaseRemoveNotification(notificationId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db
    .from('notifications')
    .delete()
    .eq('id', notificationId);
  if (error) log.warn('removeNotification failed', { error: error.message });
}

async function supabaseClearAll(userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db
    .from('notifications')
    .delete()
    .eq('user_id', userId);
  if (error) log.warn('clearAll failed', { error: error.message });
}

// ─── Notification payload builder'lar (UI'dan çağrılır) ──────
export function buildQCApprovedPayload(opts: {
  projectId: string;
  projectName: string;
  characterName: string;
  lineNumber: number;
  reviewerName: string;
}): NotifyPayload {
  return {
    type: 'qc_approved',
    title: 'Kayıt Onaylandı',
    body: `${opts.characterName} karakterinin ${opts.lineNumber}. satırı QC tarafından onaylandı.`,
    targetRole: 'voice_artist',
    meta: {
      projectId: opts.projectId,
      projectName: opts.projectName,
      characterName: opts.characterName,
      lineNumber: opts.lineNumber,
    },
  };
}

export function buildQCRejectedPayload(opts: {
  projectId: string;
  projectName: string;
  characterName: string;
  lineNumber: number;
  reviewerName: string;
}): NotifyPayload {
  return {
    type: 'qc_rejected',
    title: 'Revize İstendi',
    body: `${opts.characterName} karakterinin ${opts.lineNumber}. satırı için revize istendi.`,
    targetRole: 'voice_artist',
    meta: {
      projectId: opts.projectId,
      projectName: opts.projectName,
      characterName: opts.characterName,
      lineNumber: opts.lineNumber,
    },
  };
}

export function buildArtistUploadedPayload(opts: {
  projectId: string;
  projectName: string;
  characterName: string;
  artistName: string;
  lineNumber?: number;
}): NotifyPayload {
  return {
    type: 'artist_uploaded',
    title: 'Kayıt Yüklendi',
    body: `${opts.artistName}, ${opts.characterName} karakteri için kayıt yükledi.`,
    targetRole: 'qc_reviewer',
    meta: {
      projectId: opts.projectId,
      projectName: opts.projectName,
      characterName: opts.characterName,
      artistName: opts.artistName,
      lineNumber: opts.lineNumber,
    },
  };
}

// ─── Public API ───────────────────────────────────────────────
export const notificationService = {
  isEnabled: () => isSupabaseEnabled(),

  async loadForUser(userId: string): Promise<AppNotification[]> {
    if (!isSupabaseEnabled()) return [];
    return supabaseLoadNotifications(userId);
  },

  async add(userId: string, payload: NotifyPayload): Promise<AppNotification | null> {
    if (!isSupabaseEnabled()) return null;
    return supabaseAddNotification(userId, payload);
  },

  async markRead(notificationId: string): Promise<void> {
    if (!isSupabaseEnabled()) return;
    return supabaseMarkRead(notificationId);
  },

  async markAllRead(userId: string): Promise<void> {
    if (!isSupabaseEnabled()) return;
    return supabaseMarkAllRead(userId);
  },

  async remove(notificationId: string): Promise<void> {
    if (!isSupabaseEnabled()) return;
    return supabaseRemoveNotification(notificationId);
  },

  async clearAll(userId: string): Promise<void> {
    if (!isSupabaseEnabled()) return;
    return supabaseClearAll(userId);
  },
};
