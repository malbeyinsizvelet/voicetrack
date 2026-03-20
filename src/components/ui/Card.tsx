import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  hoverable?: boolean;
}

export function Card({ children, className = '', noPadding = false, hoverable = false, style, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        ...style,
      }}
      className={cn(
        !noPadding && 'p-4',
        hoverable && 'cursor-pointer transition-all hover:opacity-90',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold', className)} style={{ color: 'var(--text-primary)' }}>
      {children}
    </h3>
  );
}
