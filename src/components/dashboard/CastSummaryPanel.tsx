// CastSummaryPanel – GitHub'dan çekildi
import { Users, AlertTriangle, CheckCircle2, Clock, Mic2 } from 'lucide-react';
import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';
import { Badge } from '../ui/Badge';
import { computeCastProgress, progressToColorClass, formatLineCount } from '../../services/progressService';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/formatters';
import type { Project, CharacterPriority } from '../../types';

interface CastSummaryPanelProps { project: Project; }

const PRIORITY_LABELS: Record<CharacterPriority, string> = { critical: 'Kritik', high: 'Yüksek', normal: 'Normal', low: 'Düşük' };
const PRIORITY_COLORS: Record<CharacterPriority, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  normal: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  low: 'text-slate-400 bg-slate-700/40 border-slate-600/30',
};

function QuickStat({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${color} shrink-0`}>{icon}</span>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}><strong>{value}</strong> {label}</span>
    </div>
  );
}

export function CastSummaryPanel({ project }: CastSummaryPanelProps) {
  const castProgresses = project.tasks.map((task) => computeCastProgress(project, task));

  if (castProgresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Users className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Henüz cast eklenmemiş.</p>
      </div>
    );
  }

  const totalLines     = castProgresses.reduce((s, c) => s + c.totalLines, 0);
  const completedLines = castProgresses.reduce((s, c) => s + c.completedLines, 0);
  const recordedLines  = castProgresses.reduce((s, c) => s + c.recordedLines, 0);
  const pendingLines   = castProgresses.reduce((s, c) => s + c.pendingLines, 0);
  const rejectedLines  = castProgresses.reduce((s, c) => s + c.rejectedLines, 0);
  const overallPct     = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

  const overallSegments = [
    { value: completedLines, colorClass: 'bg-emerald-500', label: 'Onaylı' },
    { value: recordedLines,  colorClass: 'bg-indigo-500',  label: 'Yüklendi' },
    { value: rejectedLines,  colorClass: 'bg-red-500',     label: 'Reddedildi' },
    { value: pendingLines,   colorClass: 'bg-slate-600',   label: 'Bekliyor' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-5 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Cast Genel Durumu</h3>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{castProgresses.length} cast</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <CircularProgress percent={overallPct} size={80} strokeWidth={7} className="shrink-0" />
          <div className="flex-1 w-full">
            {totalLines > 0 ? (
              <>
                <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  <span>{completedLines} replik onaylandı</span>
                  <span>{totalLines} toplam</span>
                </div>
                <StackedProgress total={totalLines} segments={overallSegments} height={8} showLegend />
              </>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Replik verisi henüz yüklenmemiş.</p>
            )}
            <div className="flex gap-4 mt-3 flex-wrap">
              <QuickStat icon={<CheckCircle2 className="w-3 h-3" />} value={castProgresses.filter((c) => c.progressPercent === 100).length} label="Tamamlanan cast" color="text-emerald-400" />
              <QuickStat icon={<Clock className="w-3 h-3" />} value={castProgresses.filter((c) => c.progressPercent > 0 && c.progressPercent < 100).length} label="Devam eden" color="text-indigo-400" />
              <QuickStat icon={<AlertTriangle className="w-3 h-3" />} value={castProgresses.filter((c) => !c.assignedArtistName || c.assignedArtistName === 'Atanmamış').length} label="Atanmamış" color="text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Cast Bazlı İlerleme</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {castProgresses.map((cp) => {
            const colors = progressToColorClass(cp.progressPercent);
            const character = project.characters.find((c) => c.taskId === cp.taskId);
            const priority = character?.priority;
            return (
              <div key={cp.taskId} className="p-4 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <div className="flex items-start gap-3 mb-3">
                  <CircularProgress percent={cp.progressPercent} size={44} strokeWidth={5} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{cp.characterName}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{cp.assignedArtistName || 'Atanmamış'}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {priority && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[priority]}`}>
                          {PRIORITY_LABELS[priority]}
                        </span>
                      )}
                      <Badge label={TASK_STATUS_LABELS[cp.status] ?? cp.status} className={TASK_STATUS_COLORS[cp.status] ?? ''} size="xs" />
                    </div>
                  </div>
                </div>
                <div className="text-xs mb-1 flex justify-between" style={{ color: 'var(--text-muted)' }}>
                  <span>{formatLineCount(cp.completedLines, cp.totalLines)}</span>
                  <span className={colors}>{cp.progressPercent}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--progress-track)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${cp.progressPercent}%`, background: 'var(--progress-fill)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
