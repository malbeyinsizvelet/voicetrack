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
        'inline-block rounded-full border-slate-700 border-t-indigo-500 animate-spin',
        SIZE_MAP[size],
        className
      )}
    />
  );
}

// ─── Full page loading ────────────────────────────────────────
export function FullPageSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
          <Mic className="w-5 h-5 text-indigo-400" />
        </div>
        <span
          className="absolute -inset-1 rounded-2xl border-2 border-t-indigo-500 border-slate-800 animate-spin"
          style={{ borderRadius: '16px' }}
        />
      </div>
      {message && (
        <p className="text-slate-500 text-xs animate-pulse-slow">{message}</p>
      )}
    </div>
  );
}

// ─── Inline loader ────────────────────────────────────────────
export function InlineLoader({ text = 'Yükleniyor...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm animate-fade-in">
      <Spinner size="sm" />
      <span>{text}</span>
    </div>
  );
}

// ─── Section loading overlay ─────────────────────────────────
export function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-16 animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500">Yükleniyor...</p>
      </div>
    </div>
  );
}
