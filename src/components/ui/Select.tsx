import { type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, hint, options, className = '', ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        {...rest}
        className={cn(
          'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors appearance-none cursor-pointer',
          rest.disabled && 'opacity-50 cursor-not-allowed',
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
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
    </div>
  );
}
