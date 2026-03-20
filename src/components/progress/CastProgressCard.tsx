// ============================================================
// CAST PROGRESS CARD — Phase 9
// Bir cast'ın ilerleme durumunu gösteren kart bileşeni.
// İstatistik tab ve proje özet panelinde kullanılır.
// ============================================================

import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';
import { Badge } from '../ui/Badge';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/formatters';
import type { CastProgress } from '../../types';

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Kritik',
  high: 'Yüksek',
  normal: 'Normal',
  low: 'Düşük',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
  normal:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low:      'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

interface CastProgressCardProps {
  cast: CastProgress;
  onClick?: () => void;
}

export function CastProgressCard({ cast, onClick }: CastProgressCardProps) {
  const hasLines = cast.totalLines > 0;

  const segments = [
    { value: cast.approvedLines,  colorClass: 'bg-emerald-500', label: 'Onaylı' },
    { value: cast.recordedLines,  colorClass: 'bg-indigo-500',  label: 'Yüklendi' },
    { value: cast.rejectedLines + cast.retakeLines, colorClass: 'bg-red-500', label: 'Red/Retake' },
    { value: cast.pendingLines,   colorClass: 'bg-slate-600',   label: 'Bekliyor' },
  ];

  return (
    <div
      className={`bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3
        ${onClick ? 'cursor-pointer hover:border-slate-600 hover:bg-slate-800 transition-colors' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Dairesel progress */}
        <CircularProgress
          percent={cast.progressPercent}
          size={64}
          strokeWidth={6}
          sublabel={hasLines ? `${cast.completedLines}/${cast.totalLines}` : undefined}
        />

        {/* Bilgi */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-100 font-semibold text-sm truncate">{cast.characterName}</p>
            {cast.priority && cast.priority !== 'normal' && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PRIORITY_COLORS[cast.priority]}`}
              >
                {PRIORITY_LABELS[cast.priority]}
              </span>
            )}
          </div>

          <p className="text-slate-500 text-xs mt-0.5 truncate">
            {cast.assignedArtistName && cast.assignedArtistName !== 'Atanmamış'
              ? cast.assignedArtistName
              : <span className="text-amber-500/80">Atanmamış</span>}
          </p>

          <div className="mt-1.5">
            <Badge
              label={TASK_STATUS_LABELS[cast.taskStatus] ?? cast.taskStatus}
              className={TASK_STATUS_COLORS[cast.taskStatus]}
            />
          </div>
        </div>
      </div>

      {/* Stacked progress bar */}
      {hasLines ? (
        <div>
          <StackedProgress
            total={cast.totalLines}
            segments={segments}
            height={6}
          />
          {/* Satır istatistikleri */}
          <div className="grid grid-cols-4 gap-1 mt-2.5">
            <StatPill value={cast.approvedLines}  label="Onaylı"   color="text-emerald-400" />
            <StatPill value={cast.recordedLines}  label="Yüklendi" color="text-indigo-400"  />
            <StatPill value={cast.rejectedLines + cast.retakeLines}  label="Red"  color="text-red-400" />
            <StatPill value={cast.pendingLines}   label="Bekliyor" color="text-slate-500"   />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600 text-center py-1">Henüz ses dosyası yüklenmedi</p>
      )}
    </div>
  );
}

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-base font-bold ${color}`}>{value}</p>
      <p className="text-slate-600 text-xs">{label}</p>
    </div>
  );
}
