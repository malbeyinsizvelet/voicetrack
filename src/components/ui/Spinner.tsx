// ============================================================
// SPINNER — Yükleme göstergesi
// ============================================================
import { cn } from '../../utils/cn';
import { Mic } from 'lucide-react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full animate-spin border-current border-r-transparent',
        SIZE_MAP[size],
        className
      )}
    />
  );
}

export function FullPageSpinner({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 z-50"
         style={{ background: 'var(--bg-base)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
           style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <Mic className="w-6 h-6 animate-pulse" style={{ color: 'var(--text-secondary)' }} />
      </div>
      {message && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
      )}
    </div>
  );
}

export function InlineLoader({ text = 'Yükleniyor...' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
      <Spinner size="sm" />
      {text}
    </span>
  );
}

export function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <InlineLoader text="Yükleniyor..." />
    </div>
  );
}
