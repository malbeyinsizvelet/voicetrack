// ============================================================
// NOTIFICATION PANEL
// Header Bell → açılan panel.
// onNavigate: bildirime tıklayınca routing yapılır.
// ============================================================

import { useEffect, useRef } from 'react';
import {
  X, CheckCheck, Trash2, Bell,
  CheckCircle2, AlertCircle, Upload, Info, ArrowRight,
} from 'lucide-react';
import { useNotifications, type AppNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onClose:     () => void;
  onNavigate?: (path: string) => void;
}

// ─── İkon ────────────────────────────────────────────────────

function NotifIcon({ type }: { type: AppNotification['type'] }) {
  const cls = { className: 'w-4 h-4 shrink-0', style: { color: 'var(--text-secondary)' } };
  switch (type) {
    case 'qc_approved':     return <CheckCircle2 {...cls} />;
    case 'qc_rejected':     return <AlertCircle  {...cls} />;
    case 'artist_uploaded': return <Upload       {...cls} />;
    case 'error':           return <AlertCircle  {...cls} />;
    default:                return <Info         {...cls} />;
  }
}

// ─── Zaman ───────────────────────────────────────────────────

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const min  = Math.floor(diff / 60_000);
  const hr   = Math.floor(diff / 3_600_000);
  const day  = Math.floor(diff / 86_400_000);
  if (min < 1)  return 'Az önce';
  if (min < 60) return `${min} dk önce`;
  if (hr  < 24) return `${hr} sa önce`;
  return `${day} gün önce`;
}

// ─── Bildirimden route hesapla ───────────────────────────────

function resolveRoute(notif: AppNotification): string | null {
  const { meta } = notif;
  if (!meta) return null;
  if (meta.projectId) return `/projects/${meta.projectId}`;
  return null;
}

// ─── Tek satır ───────────────────────────────────────────────

function NotifRow({
  notif,
  onRead,
  onRemove,
  onNavigate,
}: {
  notif:        AppNotification;
  onRead:       (id: string) => void;
  onRemove:     (id: string) => void;
  onNavigate?:  (path: string) => void;
}) {
  const route = resolveRoute(notif);

  function handleClick() {
    onRead(notif.id);
    if (route && onNavigate) {
      onNavigate(route);
    }
  }

  return (
    <div
      className="group flex gap-3 px-4 py-3 cursor-pointer transition-colors vt-hover"
      style={{
        background:    notif.read ? 'transparent' : 'var(--bg-elevated)',
        borderBottom:  '1px solid var(--border)',
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* İkon + okunmamış nokta */}
      <div className="relative pt-0.5 shrink-0">
        <NotifIcon type={notif.type} />
        {!notif.read && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--text-primary)' }}
          />
        )}
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {notif.title}
        </p>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {notif.body}
        </p>
        {(notif.meta?.characterName || notif.meta?.projectName) && (
          <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
            {[notif.meta.projectName, notif.meta.characterName]
              .filter(Boolean).join(' · ')}
            {notif.meta.lineNumber != null ? ` · Satır #${notif.meta.lineNumber}` : ''}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(notif.createdAt)}
          </p>
          {route && (
            <span
              className="flex items-center gap-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              Git <ArrowRight className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* Sil */}
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded vt-hover shrink-0 self-start"
        onClick={(e) => { e.stopPropagation(); onRemove(notif.id); }}
        title="Sil"
        style={{ color: 'var(--text-muted)' }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────

export function NotificationPanel({ onClose, onNavigate }: Props) {
  const { currentUser }                                             = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, remove, clearAll } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Escape ile kapat
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const visible = notifications.filter(
    (n) => n.targetRole === 'all' || n.targetRole === currentUser?.role
  );

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 animate-scale-in flex flex-col"
      style={{
        background:  'var(--bg-elevated)',
        border:      '1px solid var(--border-strong)',
        boxShadow:   '0 16px 48px rgba(0,0,0,0.18)',
        maxHeight:   '480px',
      }}
    >
      {/* Başlık */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Bildirimler
          </span>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors vt-hover"
              style={{ color: 'var(--text-muted)' }}
              title="Tümünü okundu işaretle"
            >
              <CheckCheck className="w-3 h-3" />
              Tümü okundu
            </button>
          )}
          {visible.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors vt-hover"
              style={{ color: 'var(--text-muted)' }}
              title="Tümünü temizle"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors vt-hover"
            style={{ color: 'var(--text-muted)' }}
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="overflow-y-auto flex-1">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Bell className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Bildirim yok
            </p>
          </div>
        ) : (
          visible.map((n) => (
            <NotifRow
              key={n.id}
              notif={n}
              onRead={markRead}
              onRemove={remove}
              onNavigate={(path) => {
                onNavigate?.(path);
                onClose();
              }}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {visible.length > 5 && (
        <div
          className="px-4 py-2.5 shrink-0 text-center"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {visible.length} bildirim · En yeni üstte
          </p>
        </div>
      )}
    </div>
  );
}
