import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
  headerExtra?: React.ReactNode;
}

const SIZE_MAP = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-3xl',
  '2xl':'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, subtitle, children, size = 'md', footer, headerExtra }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('relative w-full flex flex-col max-h-[90vh] modal-content rounded-2xl', SIZE_MAP[size])}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.24)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h2>
              {headerExtra}
            </div>
            {subtitle && (
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="ml-3 w-7 h-7 flex items-center justify-center rounded-lg shrink-0 transition-colors vt-hover"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="shrink-0 px-5 py-3 flex items-center justify-end gap-2 rounded-b-2xl"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
