import { useEffect }        from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar }           from './Sidebar';
import { ToastProvider }     from '../ui/Toast';
import { ErrorBoundary }     from '../ui/ErrorBoundary';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';

// ─── İç layout (SidebarContext'e erişebilir) ─────────────────

function LayoutInner() {
  const { isOpen, close } = useSidebar();
  const location          = useLocation();

  // Rota değişince mobilde kapat
  useEffect(() => { close(); }, [location.pathname, close]);

  // Escape ile kapat
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Mobil overlay ─────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ───────────────────────────────────── */}
      {/*
        Desktop (lg+): inline, shrink-0
        Mobile (<lg):  fixed, z-40, slide-in/out
      */}
      <div
        className={[
          'hidden lg:flex lg:shrink-0',
          'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:flex',
          'max-lg:transition-transform max-lg:duration-200 max-lg:ease-in-out',
          isOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
        ].join(' ')}
      >
        <Sidebar />
      </div>

      {/* ── Ana içerik ────────────────────────────────── */}
      <main
        className="flex-1 overflow-y-auto min-w-0 flex flex-col"
        style={{ background: 'var(--bg-base)' }}
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

// ─── Export ──────────────────────────────────────────────────

export function AppLayout() {
  return (
    <ToastProvider>
      <SidebarProvider>
        <LayoutInner />
      </SidebarProvider>
    </ToastProvider>
  );
}
