// ── LinearProgress & StackedProgress — CSS variable tabanlı monochrome

interface LinearProgressProps {
  percent: number;
  height?: number;
  showLabel?: boolean;
  className?: string;
  animate?: boolean;
}

export function LinearProgress({
  percent,
  height = 6,
  showLabel = false,
  className = '',
  animate = true,
}: LinearProgressProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: 'var(--text-muted)' }}>İlerleme</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {clamped % 1 === 0 ? `${clamped}%` : `${clamped.toFixed(1)}%`}
          </span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden vt-progress-track"
        style={{ height }}
      >
        <div
          className={`h-full rounded-full vt-progress-fill ${animate ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// ── Stacked / Segmentli varyant ────────────────────────────────

interface StackedSegment {
  value: number;
  colorClass: string;
  label?: string;
}

interface StackedProgressProps {
  total: number;
  segments: StackedSegment[];
  height?: number;
  className?: string;
  showLegend?: boolean;
}

export function StackedProgress({
  total,
  segments,
  height = 8,
  className = '',
  showLegend = false,
}: StackedProgressProps) {
  if (total === 0) {
    return (
      <div
        className={`w-full rounded-full vt-progress-track ${className}`}
        style={{ height }}
      />
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full rounded-full overflow-hidden flex vt-progress-track"
        style={{ height }}
      >
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={i}
              className={`h-full transition-all duration-700 ease-out ${seg.colorClass}`}
              style={{
                width: `${pct}%`,
                borderRadius: i === 0 ? `${height / 2}px 0 0 ${height / 2}px` : undefined,
              }}
              title={seg.label ? `${seg.label}: ${seg.value}` : undefined}
            />
          );
        })}
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className={`w-2 h-2 rounded-full ${seg.colorClass}`} />
              {seg.label && <span>{seg.label}: {seg.value}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
