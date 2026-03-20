import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';
import type { CastProgress } from '../../types';

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Kritik',
  high: 'Yüksek',
  normal: 'Normal',
  low: 'Düşük',
};

interface Props {
  cast: CastProgress;
}

function progressToColorClass(pct: number) {
  if (pct >= 100) return { text: 'text-emerald-400', ring: 'text-emerald-500' };
  if (pct >= 60)  return { text: 'text-indigo-400',  ring: 'text-indigo-500' };
  if (pct >= 30)  return { text: 'text-amber-400',   ring: 'text-amber-500' };
  return { text: 'text-slate-400', ring: 'text-slate-500' };
}

export function CastProgressCard({ cast }: Props) {
  const hasLines = cast.totalLines > 0;
  const colors = progressToColorClass(cast.progressPercent);

  const segments = [
    { value: cast.completedLines, colorClass: 'bg-emerald-500', label: 'Onaylı' },
    { value: cast.recordedLines,  colorClass: 'bg-indigo-500',  label: 'Yüklendi' },
    { value: cast.rejectedLines,  colorClass: 'bg-red-500',     label: 'Red' },
    { value: cast.pendingLines,   colorClass: 'bg-slate-600',   label: 'Bekliyor' },
  ];

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Dairesel progress */}
        <CircularProgress
          percent={cast.progressPercent}
          size={52}
          strokeWidth={5}
        />

        {/* Bilgi */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {cast.characterName}
            </span>
            {cast.priority && cast.priority !== 'normal' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {PRIORITY_LABELS[cast.priority]}
              </span>
            )}
          </div>

          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {cast.assignedArtistName && cast.assignedArtistName !== 'Atanmamış'
              ? cast.assignedArtistName
              : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Atanmamış</span>}
          </p>

          <p className={`text-xs font-medium mt-1 ${colors.text}`}>
            {cast.progressPercent}%
          </p>
        </div>
      </div>

      {/* Stacked progress bar */}
      {hasLines ? (
        <StackedProgress
          total={cast.totalLines}
          segments={segments}
          height={6}
          showLegend
        />
      ) : (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          Henüz ses dosyası yüklenmedi
        </p>
      )}
    </div>
  );
}
