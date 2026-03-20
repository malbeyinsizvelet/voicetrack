// ============================================================
// RECENT ACTIVITY TABLE — Phase 12
// Admin/PM dashboard'da son görev aktivitelerini gösteren tablo.
// ============================================================

import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, formatRelativeDate } from '../../utils/formatters';
import type { Task, Project } from '../../types';

interface RecentActivityTableProps {
  tasks: (Task & { projectTitle?: string; project?: Project })[];
  projects: Project[];
  maxRows?: number;
}

export function RecentActivityTable({
  tasks,
  projects,
  maxRows = 10,
}: RecentActivityTableProps) {
  const navigate = useNavigate();

  // Son güncellenen task'ları sırala
  const sorted = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, maxRows);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-600">
        <Activity className="w-6 h-6 mb-2" />
        <p className="text-sm">Henüz aktivite yok.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/60">
            {[
              { label: 'Karakter', cls: '' },
              { label: 'Proje', cls: 'hidden md:table-cell' },
              { label: 'Sanatçı', cls: 'hidden lg:table-cell' },
              { label: 'Durum', cls: '' },
              { label: 'Replik', cls: 'hidden xl:table-cell text-right' },
              { label: 'Güncelleme', cls: 'hidden sm:table-cell text-right' },
            ].map((h) => (
              <th
                key={h.label}
                className={`text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 text-left ${h.cls}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {sorted.map((task) => {
            const project = projects.find((p) => p.id === task.projectId);
            const completedLines = task.lines.filter((l) => l.status === 'approved').length;
            const totalLines     = task.lines.length || task.lineCount;

            return (
              <tr
                key={task.id}
                className="hover:bg-slate-700/30 cursor-pointer transition-colors group"
                onClick={() => navigate(`/projects/${task.projectId}`)}
              >
                {/* Karakter */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {project && (
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: project.coverColor ?? '#6366f1' }}
                      />
                    )}
                    <span className="text-slate-300 font-medium group-hover:text-indigo-300 transition-colors">
                      {task.characterName}
                    </span>
                  </div>
                </td>

                {/* Proje */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-slate-500 truncate max-w-[160px] block">
                    {project?.title ?? '—'}
                  </span>
                </td>

                {/* Sanatçı */}
                <td className="px-4 py-3 hidden lg:table-cell">
                  {task.assignedArtistName && task.assignedArtistName !== 'Atanmamış' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-600/30 flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">
                        {task.assignedArtistName.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-slate-400 truncate max-w-[120px]">
                        {task.assignedArtistName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-xs">Atanmamış</span>
                  )}
                </td>

                {/* Durum */}
                <td className="px-4 py-3">
                  <Badge
                    label={TASK_STATUS_LABELS[task.status]}
                    className={TASK_STATUS_COLORS[task.status]}
                  />
                </td>

                {/* Replik */}
                <td className="px-4 py-3 hidden xl:table-cell text-right">
                  {totalLines > 0 ? (
                    <span className="text-slate-500 text-xs tabular-nums">
                      <span className="text-slate-300 font-medium">{completedLines}</span>
                      /{totalLines}
                    </span>
                  ) : (
                    <span className="text-slate-700 text-xs">—</span>
                  )}
                </td>

                {/* Güncelleme */}
                <td className="px-4 py-3 hidden sm:table-cell text-right">
                  <span className="text-slate-600 text-xs">
                    {formatRelativeDate(task.updatedAt)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
