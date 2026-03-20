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
  const iconSize  = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const titleSize = size === 'sm' ? 'text-xs'  : size === 'lg' ? 'text-base'  : 'text-sm';
  const py        = size === 'sm' ? 'py-8'     : size === 'lg' ? 'py-20'      : 'py-14';

  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-6', py, className)}>
      {icon && (
        <div className={cn('rounded-2xl flex items-center justify-center mb-4',
          iconSize,
          'bg-[var(--bg-elevated)] border border-[var(--border)]'
        )}>
          <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        </div>
      )}
      <p className={cn('font-semibold', titleSize)} style={{ color: 'var(--text-primary)' }}>{title}</p>
      {description && (
        <p className="text-xs mt-1.5 max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{description}</p>
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
      <td colSpan={colSpan} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {message}
      </td>
    </tr>
  );
}
