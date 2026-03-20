// ============================================================
// PROJECT CARD — Phase 12
// Proje listesinde ve grid görünümünde her projeyi gösteren kart.
// Phase 12: replik bazlı progress, cast sayısı, atanmış bilgisi.
// ============================================================

import { Users, FileAudio, Calendar, MoreVertical, Trash2, Edit3, Mic2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CircularProgress } from '../ui/CircularProgress';
import { StackedProgress } from '../ui/LinearProgress';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  formatDate,
  formatRelativeDate,
} from '../../utils/formatters';
import { computeProjectProgress } from '../../services/progressService';
import type { Project } from '../../types';
import { cn } from '../../utils/cn';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  canManage?: boolean;
}

export function ProjectCard({
  project,
  onClick,
  onDelete,
  onEdit,
  canManage,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Progress hesapla ──────────────────────────────────────
  const prog = computeProjectProgress(project);
  const hasLines = prog.totalLines > 0;

  const assignedCasts = (prog.castProgresses ?? []).filter(
    (c) => c.assignedArtistName && c.assignedArtistName !== 'Atanmamış'
  ).length;

  // Stacked bar segments
  const segments = [
    { value: prog.completedLines, colorClass: 'bg-emerald-500', label: 'Onaylı' },
    { value: prog.recordedLines,  colorClass: 'bg-indigo-500',  label: 'Yüklendi' },
    { value: prog.rejectedLines,  colorClass: 'bg-red-500',     label: 'Reddedildi' },
    { value: prog.pendingLines,   colorClass: 'bg-slate-600',   label: 'Bekliyor' },
  ];

  // Menü dışı tıklamada kapat
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <Card className="flex flex-col gap-0 group relative overflow-hidden">
      {/* Sol renk çizgisi */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: project.coverColor ?? '#6366f1' }}
      />

      <div className="pl-3 flex flex-col gap-3.5">
        {/* ── Header ──────────────────────────────────────── */}
        <CardHeader className="mb-0">
          <div
            className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
            onClick={onClick}
          >
            <div className="min-w-0">
              <CardTitle className="leading-snug truncate group-hover:text-indigo-300 transition-colors">
                {project.title}
              </CardTitle>
              <p className="text-slate-500 text-xs mt-0.5 truncate">{project.clientName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              label={PROJECT_STATUS_LABELS[project.status]}
              className={PROJECT_STATUS_COLORS[project.status]}
            />
            {/* Kebab menu */}
            {canManage && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                  className={cn(
                    'p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-slate-700',
                    'transition-colors opacity-0 group-hover:opacity-100',
                    menuOpen && 'opacity-100'
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-7 z-20 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1">
                    {onEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Düzenle
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sil
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        {/* Geri kalan içerik — tıklanabilir alan */}
        <div className="flex flex-col gap-3.5 cursor-pointer" onClick={onClick}>
          {/* Description */}
          {project.description && (
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
              {project.description}
            </p>
          )}

          {/* ── Progress bölümü ──────────────────────────── */}
          {hasLines ? (
            /* Replik bazlı: stacked bar + circular */
            <div className="flex items-center gap-3">
              <CircularProgress
                percent={prog.progressPercent}
                size={44}
                strokeWidth={4.5}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{prog.completedLines.toLocaleString()} replik onaylandı</span>
                  <span>{prog.totalLines.toLocaleString()} toplam</span>
                </div>
                <StackedProgress
                  total={prog.totalLines}
                  segments={segments}
                  height={6}
                />
              </div>
            </div>
          ) : (
            /* Görev bazlı: basit bar */
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>
                  {prog.completedTasks}/{prog.totalCasts} görev tamamlandı
                </span>
                <span>{Math.round(prog.progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${prog.progressPercent}%`,
                    backgroundColor: project.coverColor ?? '#6366f1',
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Stats row ─────────────────────────────────── */}
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-slate-400 font-medium">{prog.totalCasts}</span> cast
              {prog.totalCasts > 0 && (
                <span className="text-slate-600">
                  ({assignedCasts} atandı)
                </span>
              )}
            </span>

            {hasLines ? (
              <span className="flex items-center gap-1">
                <FileAudio className="w-3.5 h-3.5" />
                <span className="text-slate-400 font-medium">{prog.totalLines.toLocaleString()}</span> replik
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Mic2 className="w-3.5 h-3.5" />
                <span className="text-slate-400 font-medium">{project.tasks.length}</span> görev
              </span>
            )}

            {project.dueDate && (
              <span className="flex items-center gap-1 ml-auto">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(project.dueDate)}
              </span>
            )}
          </div>

          {/* ── Son güncelleme + task pills ───────────────── */}
          <div className="flex items-center justify-between pt-0.5 border-t border-slate-700/40">
            <span className="text-[10px] text-slate-600">
              {formatRelativeDate(project.updatedAt)}
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
              {project.tasks.slice(0, 2).map((task) => (
                <Badge
                  key={task.id}
                  label={`${task.characterName}: ${TASK_STATUS_LABELS[task.status]}`}
                  className={`${TASK_STATUS_COLORS[task.status]} text-[10px]`}
                />
              ))}
              {project.tasks.length > 2 && (
                <span className="text-[10px] text-slate-600 px-1 py-0.5">
                  +{project.tasks.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
