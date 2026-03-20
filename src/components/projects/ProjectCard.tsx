import { useState } from 'react';
import { MoreVertical, Edit2, Trash2, Users, FileAudio, Mic2, Calendar } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';
import { computeProjectProgress } from '../../services/progressService';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  formatDate,
  formatRelativeDate,
} from '../../utils/formatters';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  canManage?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({ project, onClick, canManage, onEdit, onDelete }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const prog = computeProjectProgress(project);

  const hasLines = prog.totalLines > 0;
  const assignedCasts = (prog.castProgresses ?? []).filter(
    (c: { assignedArtistName?: string }) =>
      c.assignedArtistName && c.assignedArtistName !== 'Atanmamış'
  ).length;

  const segments = [
    { value: prog.completedLines, colorClass: 'bg-emerald-500', label: 'Onaylı' },
    { value: prog.recordedLines,  colorClass: 'bg-indigo-500',  label: 'Yüklendi' },
    { value: prog.rejectedLines,  colorClass: 'bg-red-500',     label: 'Reddedildi' },
    { value: prog.pendingLines,   colorClass: 'bg-slate-600',   label: 'Bekliyor' },
  ];

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all hover:border-slate-600/60 cursor-pointer"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between p-4 pb-0">
        <div className="flex items-start gap-2.5 min-w-0" onClick={onClick}>
          <div
            className="w-1 h-full rounded-full shrink-0 mt-1 min-h-[40px]"
            style={{ backgroundColor: project.coverColor ?? '#6366f1' }}
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
              {project.title}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {project.clientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 pl-2">
          <Badge
            label={PROJECT_STATUS_LABELS[project.status]}
            className={PROJECT_STATUS_COLORS[project.status]}
          />
          {/* Kebab menu */}
          {canManage && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-700/50"
                style={{ color: 'var(--text-muted)' }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-36 rounded-xl shadow-xl z-20 py-1"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  {onEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-700/50 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Düzenle
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-900/30 transition-colors text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Sil
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Geri kalan içerik — tıklanabilir alan */}
      <div className="p-4 pt-3 space-y-3" onClick={onClick}>
        {/* Description */}
        {project.description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {project.description}
          </p>
        )}

        {/* ── Progress bölümü ──────────────────────────── */}
        {hasLines ? (
          /* Replik bazlı: stacked bar + circular */
          <div className="flex items-center gap-3">
            <CircularProgress percent={prog.progressPercent} size={44} strokeWidth={4} />
            <div className="flex-1 min-w-0">
              <StackedProgress total={prog.totalLines} segments={segments} height={6} />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {prog.completedLines.toLocaleString()} replik onaylandı
                <span className="mx-1">·</span>
                {prog.totalLines.toLocaleString()} toplam
              </p>
            </div>
          </div>
        ) : (
          /* Görev bazlı: basit bar */
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              <span>{prog.completedTasks}/{prog.totalCasts} görev tamamlandı</span>
              <span>{Math.round(prog.progressPercent)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${prog.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────── */}
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {prog.totalCasts} cast
            {prog.totalCasts > 0 && (
              <span className="text-slate-600 text-[10px]">
                ({assignedCasts} atandı)
              </span>
            )}
          </div>

          {hasLines ? (
            <div className="flex items-center gap-1">
              <FileAudio className="w-3.5 h-3.5" />
              {prog.totalLines.toLocaleString()} replik
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Mic2 className="w-3.5 h-3.5" />
              {project.tasks.length} görev
            </div>
          )}

          {project.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(project.dueDate)}
            </div>
          )}
        </div>

        {/* ── Son güncelleme + task pills ───────────────── */}
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {formatRelativeDate(project.updatedAt)}
          </span>
          <div className="flex items-center gap-1">
            {project.tasks.slice(0, 2).map((task) => (
              <span
                key={task.id}
                className="px-1.5 py-0.5 rounded text-[9px] truncate max-w-[60px]"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {task.characterName}
              </span>
            ))}
            {project.tasks.length > 2 && (
              <span
                className="px-1.5 py-0.5 rounded text-[9px]"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                +{project.tasks.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
