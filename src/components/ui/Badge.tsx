import { cn } from '../../utils/cn';

interface BadgeProps {
  label: string;
  className?: string;
  dot?: boolean;
  icon?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  style?: React.CSSProperties;
}

const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2.5 py-0.5 text-xs gap-1.5',
  md: 'px-3 py-1 text-xs gap-2',
};

export function Badge({ label, className = '', dot = false, icon, size = 'sm', style }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full font-medium leading-none', SIZES[size], className)}
      style={style}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />}
      {label}
    </span>
  );
}
