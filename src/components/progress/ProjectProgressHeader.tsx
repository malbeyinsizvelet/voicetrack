// ============================================================
// PROJECT PROGRESS HEADER — Phase 9
// ============================================================

import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';
import { formatLineCount } from '../../services/progressService';
import type { ProjectProgress } from '../../types';

interface ProjectProgressHeaderProps {
  progress: ProjectProgress;
  className?: string;
}

export function ProjectProgressHeader({ progress, className = '' }: ProjectProgressHeaderProps) {
  const {
    totalLines,
    completedLines,
    recordedLines,
    pendingLines,
    rejectedLines,
    progressPercent,
    totalCasts,
    castProgresses,
  } = progress;

  const assignedCasts  = (castProgresses ?? []).filter(
    (c) => c.assignedArtistName && c.assignedArtistName !== 'Atanmamış'
  ).length;
  const completedCasts = (castProgresses ?? []).filter(
    (c) => c.progressPercent >= 100
  ).length;

  const inProgressLines = recordedLines;
  const segments = [
    { value: completedLines,  colorClass: 'bg-emerald-500', label: 'Onaylı' },
    { value: inProgressLines, colorClass: 'bg-indigo-500',  label: 'Yüklendi' },
    { value: rejectedLines,   colorClass: 'bg-red-500',     label: 'Red' },
    { value: pendingLines,    colorClass: 'bg-slate-600',   label: 'Bekliyor' },
  ];

  return (
    <div className={`bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">

        {/* Dairesel progress — büyük */}
        <div className="shrink-0">
          <CircularProgress
            percent={progressPercent}
            size={88}
            strokeWidth={8}
            sublabel={totalLines > 0 ? `${completedLines}/${totalLines}` : 'satır'}
          />
        </div>

        {/* Sağ taraf */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-1">
            <p className="text-slate-300 text-sm font-medium">Genel Proje İlerlemesi</p>
            <p className="text-slate-500 text-xs">{formatLineCount(completedLines, totalLines)} satır onaylandı</p>
          </div>

          <StackedProgress
            total={totalLines}
            segments={segments}
            height={10}
          />

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
            <LegendItem color="bg-emerald-500" label="Onaylı" value={completedLines} />
            <LegendItem color="bg-indigo-500"  label="Yüklendi (QC bekliyor)" value={inProgressLines} />
            <LegendItem color="bg-red-500"     label="Red / Retake" value={rejectedLines} />
            <LegendItem color="bg-slate-600"   label="Bekliyor" value={pendingLines} />
          </div>
        </div>

        {/* Cast özet istatistikleri */}
        <div className="shrink-0 flex sm:flex-col gap-3 sm:gap-2 text-center sm:text-right">
          <CastStat value={totalCasts}     label="Toplam Cast" />
          <CastStat value={assignedCasts}  label="Atanmış" color="text-indigo-400" />
          <CastStat value={completedCasts} label="Tamamlanan" color="text-emerald-400" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
      <span>{label}:</span>
      <span className="text-slate-300 font-medium">{value}</span>
    </div>
  );
}

function CastStat({
  value,
  label,
  color = 'text-slate-200',
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-600 text-xs">{label}</p>
    </div>
  );
}
