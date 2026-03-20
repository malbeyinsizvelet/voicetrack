import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '../ui/Toast';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';

// ─── İç layout (SidebarContext'e erişebilir) ─────────────────
function LayoutInner() {
  const { isOpen, close } = useSidebar();
  const location = useLocation();

  // Rota değişince mobilde kapat
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  // Escape ile kapat
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        {/* ── Mobil overlay ─────────────────────────────── */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={close}
          />
        )}

        {/* ── Sidebar ───────────────────────────────────── */}
        {/* Desktop (lg+): inline, shrink-0
            Mobile (<lg): fixed, slide-in */}
        <div
          className={`
            fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
            transition-transform duration-200
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <Sidebar />
        </div>

        {/* ── Ana içerik ────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </ToastProvider>
  );
}

// ─── Export ──────────────────────────────────────────────────
export function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
