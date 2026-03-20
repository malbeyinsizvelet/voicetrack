import { useState }          from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Mic2, CheckSquare,
  Settings, LogOut, Mic, ShieldCheck, ChevronRight, X,
} from 'lucide-react';
import { cn }             from '../../utils/cn';
import { useAuth }        from '../../context/AuthContext';
import { useProjects }    from '../../context/ProjectContext';
import { useSidebar }     from '../../context/SidebarContext';
import { ROLE_LABELS }    from '../../utils/formatters';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard, roles: ['admin','project_manager','voice_artist','qc_reviewer'] },
  { to: '/projects',  label: 'Projeler',    icon: FolderOpen,      roles: ['admin','project_manager','qc_reviewer'] },
  { to: '/my-tasks',  label: 'Görevlerim',  icon: Mic2,            roles: ['voice_artist'] },
  { to: '/qc',        label: 'QC İnceleme', icon: CheckSquare,     roles: ['admin','qc_reviewer'] },
  { to: '/settings',  label: 'Ayarlar',     icon: Settings,        roles: ['admin','project_manager','voice_artist','qc_reviewer'] },
] as const;

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { projects }            = useProjects();
  const { close }               = useSidebar();
  const navigate                = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!currentUser) return null;

  const visibleNav = NAV_ITEMS.filter((item) =>
    (item.roles as readonly string[]).includes(currentUser.role)
  );

  const recentProjects = currentUser.role === 'voice_artist'
    ? projects.filter((p) => p.tasks.some((t) => t.assignedTo === currentUser.id)).slice(0, 5)
    : projects.filter((p) => p.status === 'active').slice(0, 5);

  const isManagerRole = ['admin', 'project_manager'].includes(currentUser.role);

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-screen"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* ── Logo + mobil kapat ─────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'var(--text-primary)' }}
        >
          <Mic className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-bold text-sm leading-none block" style={{ color: 'var(--text-primary)' }}>
            VoiceTrack
          </span>
          <span className="text-[11px] mt-0.5 block" style={{ color: 'var(--text-muted)' }}>
            Studio · v1.0
          </span>
        </div>
        {/* Mobil: kapat butonu */}
        <button
          onClick={close}
          className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors vt-hover shrink-0"
          style={{ color: 'var(--text-muted)' }}
          title="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Nav ───────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto pt-3 pb-2 px-2 space-y-0.5">
        {visibleNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all interactive',
                isActive ? 'vt-bg-active' : 'vt-hover'
              )
            }
            style={({ isActive }) => ({
              color:  isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
            })}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        {/* Projelerim (sanatçı) */}
        {currentUser.role === 'voice_artist' && recentProjects.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-1"
               style={{ color: 'var(--text-muted)' }}>
              Projelerim
            </p>
            <div className="space-y-0.5">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => { navigate(`/projects/${project.id}`); close(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group interactive vt-hover"
                  style={{ border: '1px solid transparent' }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0"
                       style={{ background: 'var(--text-secondary)' }} />
                  <span className="truncate text-xs leading-tight flex-1"
                        style={{ color: 'var(--text-secondary)' }}>
                    {project.title}
                  </span>
                  <ChevronRight className="w-3 h-3 shrink-0 -mr-1"
                                style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aktif Projeler (admin/pm) */}
        {isManagerRole && recentProjects.length > 0 && (
          <div className="pt-4">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-1"
               style={{ color: 'var(--text-muted)' }}>
              Aktif Projeler
            </p>
            <div className="space-y-0.5">
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => { navigate(`/projects/${project.id}`); close(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group interactive vt-hover"
                  style={{ border: '1px solid transparent' }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0"
                       style={{ background: 'var(--text-secondary)' }} />
                  <span className="truncate text-xs leading-tight flex-1"
                        style={{ color: 'var(--text-secondary)' }}>
                    {project.title}
                  </span>
                  <ChevronRight className="w-3 h-3 shrink-0 -mr-1"
                                style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── Rol tag ───────────────────────────────── */}
      <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
             style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
            {ROLE_LABELS[currentUser.role]}
          </span>
        </div>
      </div>

      {/* ── User footer ───────────────────────────── */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {currentUser.name}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
              {currentUser.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors vt-hover shrink-0"
            style={{ color: 'var(--text-muted)' }}
            title="Çıkış yap"
          >
            {loggingOut
              ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
              : <LogOut className="w-3.5 h-3.5" />
            }
          </button>
        </div>
      </div>
    </aside>
  );
}
