// ============================================================
// EMPTY STATE — Boş durum ekranı
// ============================================================

import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const iconSize = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const titleSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const py = size === 'sm' ? 'py-8' : size === 'lg' ? 'py-20' : 'py-14';

  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center animate-fade-in', py, className)}>
      {icon && (
        <div
          className={cn(
            'rounded-2xl bg-slate-800/80 border border-slate-700/60',
            'flex items-center justify-center text-slate-500 mb-4 shrink-0',
            iconSize
          )}
        >
          {icon}
        </div>
      )}
      <p className={cn('text-slate-300 font-medium leading-snug', titleSize)}>{title}</p>
      {description && (
        <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Inline boş mesaj (tablo satırı vs.) ─────────────────────
export function EmptyRow({
  message,
  colSpan = 1,
}: {
  message: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-slate-500 text-sm">
        {message}
      </td>
    </tr>
  );
}
