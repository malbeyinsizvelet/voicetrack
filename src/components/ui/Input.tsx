import { type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, hint, leftElement, rightElement, className = '', ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftElement && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}>
            {leftElement}
          </span>
        )}
        <input
          {...rest}
          className={cn(
            'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors',
            leftElement && 'pl-9',
            rightElement && 'pr-9',
            className
          )}
          style={{
            background: 'var(--bg-input)',
            border: `1px solid ${error ? 'var(--border-strong)' : 'var(--border)'}`,
            color: 'var(--text-primary)',
            ...(rest.style ?? {}),
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-strong)';
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--border-strong)' : 'var(--border)';
            rest.onBlur?.(e);
          }}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}>
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
    </div>
  );
}
