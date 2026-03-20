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
    <span
      className="font-bold"
      style={{ fontSize: size * 0.19, color: 'var(--text-primary)' }}
    >
      {clampedPct % 1 === 0 ? `${clampedPct}%` : `${clampedPct.toFixed(1)}%`}
    </span>
  );

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          style={{ stroke: 'var(--progress-track)' }}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            stroke: 'var(--progress-fill)',
            transitionDuration: `${animationDuration}ms`,
            transitionProperty: 'stroke-dashoffset',
            transitionTimingFunction: 'ease-out',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight px-1">
        {displayLabel}
        {sublabel && (
          <span
            className="mt-0.5 block"
            style={{ fontSize: size * 0.13, color: 'var(--text-muted)' }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
