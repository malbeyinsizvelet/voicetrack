// ============================================================
// SIDEBAR CONTEXT
// Hamburger (mobil) açık/kapalı durumunu global tutar.
// TopBar → toggle; AppLayout → overlay ve sidebar visibility.
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SidebarContextValue {
  isOpen:  boolean;
  open:    () => void;
  close:   () => void;
  toggle:  () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open   = useCallback(() => setIsOpen(true),          []);
  const close  = useCallback(() => setIsOpen(false),         []);
  const toggle = useCallback(() => setIsOpen((v) => !v),     []);
  return (
    <SidebarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
