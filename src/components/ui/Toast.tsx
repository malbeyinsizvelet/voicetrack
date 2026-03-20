// ============================================================
// TOAST — Bildirim sistemi
// ============================================================
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_CONFIG: Record<ToastType, { icon: React.ReactNode; classes: string; bar: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    classes: 'border-emerald-800/60 bg-slate-900',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
    classes: 'border-red-800/60 bg-slate-900',
    bar: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    classes: 'border-amber-800/60 bg-slate-900',
    bar: 'bg-amber-500',
  },
  info: {
    icon: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
    classes: 'border-indigo-800/60 bg-slate-900',
    bar: 'bg-indigo-500',
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const cfg = TOAST_CONFIG[toast.type];
  return (
    <div
      className={cn(
        'relative w-80 rounded-xl border shadow-2xl overflow-hidden animate-fade-in',
        cfg.classes
      )}
    >
      <div className={cn('absolute bottom-0 left-0 h-0.5 animate-shrink', cfg.bar)}
           style={{ animationDuration: `${toast.duration ?? 4000}ms` }} />
      <div className="flex items-start gap-3 p-4">
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-slate-600 hover:text-slate-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const duration = opts.duration ?? 4000;
      setToasts((prev) => [...prev.slice(-4), { ...opts, id, duration }]);
      const timer = setTimeout(() => dismiss(id), duration + 300);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const success = useCallback((title: string, message?: string) => toast({ type: 'success', title, message }), [toast]);
  const error   = useCallback((title: string, message?: string) => toast({ type: 'error',   title, message }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ type: 'warning', title, message }), [toast]);
  const info    = useCallback((title: string, message?: string) => toast({ type: 'info',    title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
