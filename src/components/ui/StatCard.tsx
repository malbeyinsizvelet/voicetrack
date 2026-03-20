import { cn } from '../../utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
  trend?: { value: number; label?: string };
  className?: string;
  color?: string;
  accentColor?: string;
}

export function StatCard({ label, value, icon, sub, trend, className = '' }: StatCardProps) {
  return (
    <div
      className={cn('rounded-xl p-4 transition-all', className)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {sub && <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
          {trend !== undefined && (
            <div className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              {trend.label && <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
