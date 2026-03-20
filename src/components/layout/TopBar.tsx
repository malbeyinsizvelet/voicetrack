import { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, ChevronDown, ShieldCheck, Sun, Moon, Menu } from 'lucide-react';
import { useNavigate }       from 'react-router-dom';
import { useAuth }           from '../../context/AuthContext';
import { useTheme }          from '../../context/ThemeContext';
import { useNotifications }  from '../../context/NotificationContext';
import { useSidebar }        from '../../context/SidebarContext';
import { ROLE_LABELS }       from '../../utils/formatters';
import { NotificationPanel } from '../ui/NotificationPanel';
import { cn }                from '../../utils/cn';

interface TopBarProps {
  title:     string;
  subtitle?: string;
  actions?:  React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { currentUser, logout }   = useAuth();
  const { toggleTheme, isDark }   = useTheme();
  const { notifications }         = useNotifications();
  const { toggle: toggleSidebar } = useSidebar();
  const navigate                  = useNavigate();

  const [dropdownOpen, setDropdown] = useState(false);
  const [notifOpen,    setNotifOpen]  = useState(false);
  const [loggingOut,   setLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
      setDropdown(false);
    }
  }

  const initials = currentUser?.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  const visibleUnread = notifications.filter(
    (n) => !n.read && (n.targetRole === 'all' || n.targetRole === currentUser?.role)
  ).length;

  return (
    <header
      className="h-14 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-20 gap-3"
      style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}
    >
      {/* ── Sol ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors vt-hover shrink-0"
          style={{ color: 'var(--text-secondary)' }}
          title="Menüyü aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1
            className="font-semibold text-base leading-none truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Sağ ─────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">

        {actions && (
          <div className="hidden sm:flex items-center gap-2 mr-1">
            {actions}
          </div>
        )}

        {/* Tema toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors vt-hover"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Bildirimler */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setDropdown(false); }}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors vt-hover"
            style={{ color: 'var(--text-secondary)' }}
            title="Bildirimler"
          >
            <Bell className="w-4 h-4" />
            {visibleUnread > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold"
                style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}
              >
                {visibleUnread > 9 ? '9+' : visibleUnread}
              </span>
            )}
          </button>

          {notifOpen && (
            <NotificationPanel
              onClose={() => setNotifOpen(false)}
              onNavigate={(path) => { setNotifOpen(false); navigate(path); }}
            />
          )}
        </div>

        {/* Kullanıcı dropdown */}
        {currentUser && (
          <div className="relative ml-0.5" ref={dropdownRef}>
            <button
              onClick={() => { setDropdown((v) => !v); setNotifOpen(false); }}
              className={cn(
                'flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-xl transition-colors',
                dropdownOpen ? 'vt-bg-elevated' : 'vt-hover'
              )}
              style={{ border: '1px solid var(--border)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}
              >
                {initials}
              </div>
              <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                {currentUser.name.split(' ')[0]}
              </span>
              <ChevronDown
                className={cn('w-3 h-3 transition-transform duration-150', dropdownOpen && 'rotate-180')}
                style={{ color: 'var(--text-muted)' }}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-60 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'var(--bg-elevated)',
                  border:     '1px solid var(--border-strong)',
                  boxShadow:  '0 16px 48px rgba(0,0,0,0.18)',
                }}
              >
                {/* Kullanıcı bilgisi */}
                <div className="px-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {currentUser.name}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 rounded-lg w-fit text-xs font-medium"
                    style={{
                      background: 'var(--bg-hover)',
                      border:     '1px solid var(--border)',
                      color:      'var(--text-secondary)',
                    }}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {ROLE_LABELS[currentUser.role]}
                  </div>
                </div>

                {/* Çıkış */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors vt-hover"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {loggingOut
                      ? <span className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                      : <LogOut className="w-4 h-4" />
                    }
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
