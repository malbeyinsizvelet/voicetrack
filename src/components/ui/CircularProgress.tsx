import { useMemo } from 'react';

interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  className?: string;
  animationDuration?: number;
}

export function CircularProgress({
  percent,
  size = 80,
  strokeWidth = 7,
  label,
  sublabel,
  className = '',
  animationDuration = 600,
}: CircularProgressProps) {
  const clampedPct = Math.min(100, Math.max(0, percent));
  const { radius, circumference, strokeDashoffset } = useMemo(() => {
    const r = (size - strokeWidth * 2) / 2;
    const c = 2 * Math.PI * r;
    return { radius: r, circumference: c, strokeDashoffset: c - (clampedPct / 100) * c };
  }, [size, strokeWidth, clampedPct]);

  const cx = size / 2;
  const cy = size / 2;

  const displayLabel = label ?? (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
      className="text-xs font-bold" style={{ fill: 'var(--text-primary)', fontSize: size * 0.18 }}>
      {clampedPct % 1 === 0 ? `${clampedPct}%` : `${clampedPct.toFixed(1)}%`}
    </text>
  );

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={radius} fill="none"
          strokeWidth={strokeWidth} style={{ stroke: 'var(--bg-elevated)' }} />
        <circle cx={cx} cy={cy} r={radius} fill="none"
          strokeWidth={strokeWidth}
          style={{
            stroke: 'var(--text-primary)',
            strokeDasharray: circumference,
            strokeDashoffset,
            strokeLinecap: 'round',
            transition: `stroke-dashoffset ${animationDuration}ms ease-out`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)', fontSize: size * 0.18 }}>
          {clampedPct % 1 === 0 ? `${clampedPct}%` : `${clampedPct.toFixed(1)}%`}
        </span>
        {sublabel && (
          <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontSize: size * 0.13 }}>
            {sublabel}
          </span>
        )}
      </div>
      {displayLabel && false /* SVG label replaced by div overlay */}
    </div>
  );
}
