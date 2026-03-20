import { CheckCircle2, Clock, XCircle, RefreshCw, Mic } from 'lucide-react';
import type { LineStatus } from '../../types';

interface LineStatusConfig {
  label: string;
  icon: React.ReactNode;
  style: React.CSSProperties;
}

export const LINE_STATUS_CONFIG: Record<LineStatus, LineStatusConfig> = {
  pending: {
    label: 'Bekliyor',
    icon: <Clock className="w-3 h-3" />,
    style: { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
  },
  recorded: {
    label: 'Kaydedildi',
    icon: <Mic className="w-3 h-3" />,
    style: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' },
  },
  approved: {
    label: 'Onaylandı',
    icon: <CheckCircle2 className="w-3 h-3" />,
    style: { background: 'var(--accent)', color: 'var(--accent-text)', border: '1px solid var(--accent)' },
  },
  rejected: {
    label: 'Reddedildi',
    icon: <XCircle className="w-3 h-3" />,
    style: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' },
  },
  retake: {
    label: 'Retake',
    icon: <RefreshCw className="w-3 h-3" />,
    style: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' },
  },
};

interface Props {
  status: LineStatus;
  size?: 'xs' | 'sm';
  showIcon?: boolean;
}

export function LineStatusBadge({ status, size = 'sm', showIcon = true }: Props) {
  const config = LINE_STATUS_CONFIG[status];
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-xs';
  const padding  = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ${textSize} ${padding}`}
      style={config.style}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}
