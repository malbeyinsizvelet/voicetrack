// ============================================================
// CAST SUMMARY PANEL — Phase 12
// ProjectDetail > Stats Tab içinde cast bazlı ilerleme özeti.
// Her cast: circular progress, sanatçı, replik sayısı, durum.
// ============================================================

import { Users, AlertTriangle, CheckCircle2, Clock, Mic2 } from 'lucide-react';
import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';
import { Badge } from '../ui/Badge';
import {
  computeCastProgress,
  progressToColorClass,
  formatLineCount,
} from '../../services/progressService';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/formatters';
import type { Project, CharacterPriority } from '../../types';

interface CastSummaryPanelProps {
  project: Project;
}

const PRIORITY_LABELS: Record<CharacterPriority, string> = {
  critical: 'Kritik',
  high: 'Yüksek',
  normal: 'Normal',
  low: 'Düşük',
};

const PRIORITY_COLORS: Record<CharacterPriority, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  normal: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  low: 'text-slate-400 bg-slate-700/40 border-slate-600/30',
};

export function CastSummaryPanel({ project }: CastSummaryPanelProps) {
  const castProgresses = project.tasks.map((task) =>
    computeCastProgress(project, task)
  );

  if (castProgresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Users className="w-8 h-8 text-slate-700 mb-2" />
        <p className="text-slate-500 text-sm">Henüz cast eklenmemiş.</p>
      </div>
    );
  }

  // Toplamlar
  const totalLines     = castProgresses.reduce((s, c) => s + c.totalLines, 0);
  const completedLines = castProgresses.reduce((s, c) => s + c.completedLines, 0);
  const recordedLines  = castProgresses.reduce((s, c) => s + c.recordedLines, 0);
  const pendingLines   = castProgresses.reduce((s, c) => s + c.pendingLines, 0);
  const rejectedLines  = castProgresses.reduce((s, c) => s + c.rejectedLines, 0);

  const overallPct = totalLines > 0
    ? Math.round((completedLines / totalLines) * 100)
    : 0;

  const overallSegments = [
    { value: completedLines, colorClass: 'bg-emerald-500', label: 'Onaylı' },
    { value: recordedLines,  colorClass: 'bg-indigo-500',  label: 'Yüklendi' },
    { value: rejectedLines,  colorClass: 'bg-red-500',     label: 'Reddedildi' },
    { value: pendingLines,   colorClass: 'bg-slate-600',   label: 'Bekliyor' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Genel Özet Banner ──────────────────────────────── */}
      <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-300">Cast Genel Durumu</h3>
          <span className="text-xs text-slate-600 ml-auto">{castProgresses.length} cast</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Dairesel */}
          <CircularProgress
            percent={overallPct}
            size={80}
            strokeWidth={7}
            className="shrink-0"
          />

          {/* Sağ taraf */}
          <div className="flex-1 w-full">
            {totalLines > 0 ? (
              <>
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>{completedLines} replik onaylandı</span>
                  <span>{totalLines} toplam</span>
                </div>
                <StackedProgress
                  total={totalLines}
                  segments={overallSegments}
                  height={8}
                  showLegend
                />
              </>
            ) : (
              <p className="text-xs text-slate-600">Replik verisi henüz yüklenmemiş.</p>
            )}

            {/* Mini stat row */}
            <div className="flex gap-4 mt-3 flex-wrap">
              <QuickStat
                icon={<CheckCircle2 className="w-3 h-3" />}
                value={castProgresses.filter((c) => c.progressPercent === 100).length}
                label="Tamamlanan cast"
                color="text-emerald-400"
              />
              <QuickStat
                icon={<Clock className="w-3 h-3" />}
                value={castProgresses.filter((c) => c.progressPercent > 0 && c.progressPercent < 100).length}
                label="Devam eden"
                color="text-indigo-400"
              />
              <QuickStat
                icon={<AlertTriangle className="w-3 h-3" />}
                value={castProgresses.filter((c) => !c.assignedArtistName || c.assignedArtistName === 'Atanmamış').length}
                label="Atanmamış"
                color="text-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Cast Kartları Grid ─────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Cast Bazlı İlerleme
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {castProgresses.map((cp) => {
            const colors = progressToColorClass(cp.progressPercent);
            const character = project.characters.find((c) => c.taskId === cp.taskId);
            const priority = character?.priority;

            const segments = [
              { value: cp.completedLines, colorClass: 'bg-emerald-500' },
              { value: cp.recordedLines,  colorClass: 'bg-indigo-500' },
              { value: cp.rejectedLines,  colorClass: 'bg-red-500' },
              { value: cp.pendingLines,   colorClass: 'bg-slate-600' },
            ];

            return (
              <div
                key={cp.taskId}
                className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 hover:border-slate-600/60 transition-colors"
              >
                {/* Üst: isim + öncelik */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-slate-200 font-medium text-sm truncate">
                      {cp.characterName}
                    </p>
                    <p className="text-slate-500 text-xs truncate mt-0.5">
                      {cp.assignedArtistName ?? 'Atanmamış'}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {priority && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[priority]}`}
                      >
                        {PRIORITY_LABELS[priority]}
                      </span>
                    )}
                    <Badge
                      label={TASK_STATUS_LABELS[cp.taskStatus]}
                      className={`text-[10px] ${TASK_STATUS_COLORS[cp.taskStatus]}`}
                    />
                  </div>
                </div>

                {/* Orta: Circular + bar */}
                <div className="flex items-center gap-4">
                  <CircularProgress
                    percent={cp.progressPercent}
                    size={52}
                    strokeWidth={5}
                  />
                  <div className="flex-1 min-w-0">
                    {cp.totalLines > 0 ? (
                      <>
                        <StackedProgress
                          total={cp.totalLines}
                          segments={segments}
                          height={6}
                          className="mb-1.5"
                        />
                        <p className="text-xs text-slate-500">
                          {formatLineCount(cp.completedLines, cp.totalLines)} replik
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-600 text-xs">
                        <Mic2 className="w-3 h-3" />
                        Replik yüklenmemiş
                      </div>
                    )}
                  </div>
                </div>

                {/* Alt: Replik detayı */}
                {cp.totalLines > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40 grid grid-cols-4 gap-1 text-center">
                    <ReplikMini label="Onaylı" value={cp.completedLines} color={colors.text} />
                    <ReplikMini label="Yüklendi" value={cp.recordedLines} color="text-indigo-400" />
                    <ReplikMini label="Red" value={cp.rejectedLines} color="text-red-400" />
                    <ReplikMini label="Bekliyor" value={cp.pendingLines} color="text-slate-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Alt bileşenler ─────────────────────────────────────────────

function QuickStat({
  icon, value, label, color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <span className="text-slate-300 font-semibold text-xs">{value}</span>
      <span className="text-slate-600 text-xs">{label}</span>
    </div>
  );
}

function ReplikMini({
  label, value, color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-600">{label}</p>
    </div>
  );
}
