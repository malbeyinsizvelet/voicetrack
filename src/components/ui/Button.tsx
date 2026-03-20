import { type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const baseStyle: React.CSSProperties = (() => {
    switch (variant) {
      case 'primary':
        return { background: 'var(--text-primary)', color: 'var(--accent-text)', border: '1px solid var(--text-primary)' };
      case 'secondary':
        return { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' };
      case 'ghost':
        return { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' };
      case 'danger':
        return { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' };
    }
  })();

  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all shrink-0',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        SIZES[size],
        className
      )}
      style={{ ...baseStyle, ...style }}
    >
      {isLoading ? <Spinner size="xs" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
