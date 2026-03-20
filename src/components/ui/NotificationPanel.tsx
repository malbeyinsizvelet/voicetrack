import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Bell, X, Check, Trash2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onNavigate: (path: string) => void;
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'az önce';
  if (mins < 60)  return `${mins} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} gün önce`;
}

export function NotificationPanel({ onClose, onNavigate }: Props) {
  const { currentUser } = useAuth();
  const { notifications, markRead, markAllRead, remove, clearAll } = useNotifications();

  const visible = notifications.filter(
    (n) => n.targetRole === 'all' || n.targetRole === currentUser?.role
  );
  const unread = visible.filter((n) => !n.read).length;

  function getRoute(n: { type: string; meta?: { projectId?: string } }): string | null {
    if (n.type === 'upload' || n.type === 'qc_result') {
      return n.meta?.projectId ? `/projects/${n.meta.projectId}` : null;
    }
    return null;
  }

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
           style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Bildirimler
          </span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="p-1 rounded-lg transition-colors"
              title="Tümünü okundu işaretle"
              style={{ color: 'var(--text-muted)' }}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          {visible.length > 0 && (
            <button
              onClick={clearAll}
              className="p-1 rounded-lg transition-colors"
              title="Tümünü temizle"
              style={{ color: 'var(--text-muted)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bildirim yok</p>
          </div>
        ) : (
          visible.map((notif) => {
            const route = getRoute(notif);
            return (
              <div
                key={notif.id}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: notif.read ? 'transparent' : 'var(--bg-hover)',
                }}
                onClick={() => {
                  markRead(notif.id);
                  if (route) onNavigate(route);
                }}
              >
                {/* İkon + okunmamış nokta */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                       style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    🔔
                  </div>
                  {!notif.read && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                          style={{ background: 'var(--text-primary)' }} />
                  )}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {notif.title}
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {notif.body}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>

                {/* Sil */}
                <button
                  onClick={(e) => { e.stopPropagation(); remove(notif.id); }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
