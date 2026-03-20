// ============================================================
// OVERALL PROGRESS BANNER – Phase 12
// Admin/PM dashboard'da tüm sistem genel ilerleme özeti.
// ============================================================

import { TrendingUp, Layers, Mic2, CheckCircle2, Clock } from 'lucide-react';
import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';

interface OverallProgressBannerProps {
  totalProjects: number;
  activeProjects: number;
  totalLines: number;
  completedLines: number;
  recordedLines: number;
  pendingLines: number;
  progressPercent: number;
  totalCasts: number;
  assignedCasts: number;
}

export function OverallProgressBanner({
  totalProjects,
  activeProjects,
  totalLines,
  completedLines,
  recordedLines,
  pendingLines,
  progressPercent,
  totalCasts,
  assignedCasts,
}: OverallProgressBannerProps) {
  const segments = [
    { value: completedLines, colorClass: 'bg-emerald-500', label: 'Onaylı' },
    { value: recordedLines,  colorClass: 'bg-indigo-500',  label: 'Yüklendi' },
    { value: pendingLines,   colorClass: 'bg-slate-600',   label: 'Bekliyor' },
  ];

  const assignPct = totalCasts > 0 ? Math.round((assignedCasts / totalCasts) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
      {/* Başlık */}
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Sistem Geneli İlerleme
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        {/* Sol: Dairesel progress */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <CircularProgress
            percent={progressPercent}
            size={100}
            strokeWidth={9}
          />
          <p className="text-xs text-slate-500 mt-1">Genel Tamamlanma</p>
        </div>

        {/* Orta: Stacked bar + sayılar */}
        <div className="flex-1 w-full min-w-0">
          {totalLines > 0 ? (
            <>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>{completedLines.toLocaleString()} replik onaylandı</span>
                <span>{totalLines.toLocaleString()} toplam replik</span>
              </div>
              <StackedProgress
                total={totalLines}
                segments={segments}
                height={10}
                showLegend
                className="mb-2"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-10 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-600">Henüz replik yüklenmemiş</p>
            </div>
          )}

          {/* Atama durumu */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">Cast atama:</span>
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${assignPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {assignedCasts}/{totalCasts} atandı
            </span>
          </div>
        </div>

        {/* Sağ: Sayısal özet */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 shrink-0 lg:min-w-[140px]">
          <MiniStat
            icon={<Layers className="w-3.5 h-3.5" />}
            label="Toplam Proje"
            value={totalProjects}
            color="text-indigo-400"
          />
          <MiniStat
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Aktif"
            value={activeProjects}
            color="text-amber-400"
          />
          <MiniStat
            icon={<Mic2 className="w-3.5 h-3.5" />}
            label="Toplam Cast"
            value={totalCasts}
            color="text-blue-400"
          />
          <MiniStat
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            label="Onaylı Replik"
            value={completedLines}
            color="text-emerald-400"
          />
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={color}>{icon}</span>
      <div>
        <p className="text-slate-100 font-bold text-sm leading-none">{value.toLocaleString()}</p>
        <p className="text-slate-500 text-[10px] mt-0.5">{label}</p>
      </div>
    </div>
  );
}
