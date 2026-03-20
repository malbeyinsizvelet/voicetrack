// ============================================================
// PROJECT SUMMARY TABLE — Phase 12
// Admin/PM dashboard'da proje bazlı özet tablo.
// Her satırda: durum, cast, görev, replik, progress, tarih.
// ============================================================

import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Mic2, FileAudio, Calendar } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { LinearProgress } from '../ui/LinearProgress';
import { CircularProgress } from '../ui/CircularProgress';
import { computeProjectProgress } from '../../services/progressService';
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, formatDate, formatRelativeDate } from '../../utils/formatters';
import type { Project, CastProgress } from '../../types';

interface ProjectSummaryTableProps {
  projects: Project[];
  className?: string;
}

export function ProjectSummaryTable({ projects, className = '' }: ProjectSummaryTableProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className={`bg-slate-800/40 border border-slate-700/40 rounded-xl p-8 text-center ${className}`}>
        <p className="text-slate-500 text-sm">Henüz proje yok.</p>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/40 border border-slate-700/40 rounded-xl overflow-hidden ${className}`}>
      {/* Desktop tablo */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/60">
              {['Proje', 'Durum', 'Cast', 'Replik', 'İlerleme', 'Son Güncelleme', ''].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {projects.map((project) => {
              const prog = computeProjectProgress(project);
              const assignedCasts = (prog.castProgresses ?? []).filter(
                (c: CastProgress) => c.assignedArtistName && c.assignedArtistName !== 'Atanmamış'
              ).length;

              return (
                <tr
                  key={project.id}
                  className="hover:bg-slate-700/30 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {/* Proje adı */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-8 rounded-full shrink-0"
                        style={{ backgroundColor: project.coverColor ?? '#6366f1' }}
                      />
                      <div className="min-w-0">
                        <p className="text-slate-200 font-medium truncate max-w-[180px] group-hover:text-indigo-300 transition-colors">
                          {project.title}
                        </p>
                        <p className="text-slate-500 text-xs truncate max-w-[180px]">
                          {project.clientName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Durum */}
                  <td className="px-4 py-3.5">
                    <Badge
                      label={PROJECT_STATUS_LABELS[project.status]}
                      className={PROJECT_STATUS_COLORS[project.status]}
                    />
                  </td>

                  {/* Cast */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium text-slate-300">{prog.totalCasts}</span>
                      <span className="text-slate-600 text-xs">
                        ({assignedCasts} atanmış)
                      </span>
                    </div>
                  </td>

                  {/* Replik */}
                  <td className="px-4 py-3.5">
                    {prog.totalLines > 0 ? (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <FileAudio className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium text-slate-300">
                          {prog.completedLines.toLocaleString()}
                        </span>
                        <span className="text-slate-600 text-xs">
                          / {prog.totalLines.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Mic2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-slate-600 text-xs">{project.tasks.length} görev</span>
                      </div>
                    )}
                  </td>

                  {/* İlerleme */}
                  <td className="px-4 py-3.5 min-w-[140px]">
                    <div className="flex items-center gap-3">
                      <CircularProgress
                        percent={prog.progressPercent}
                        size={32}
                        strokeWidth={3.5}
                        label={
                          <span className="text-[8px] font-bold text-slate-300">
                            {Math.round(prog.progressPercent)}%
                          </span>
                        }
                      />
                      <LinearProgress
                        percent={prog.progressPercent}
                        height={4}
                        className="flex-1"
                      />
                    </div>
                  </td>

                  {/* Son Güncelleme */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatRelativeDate(project.updatedAt)}
                    </div>
                    {project.dueDate && (
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        Teslim: {formatDate(project.dueDate)}
                      </p>
                    )}
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-3.5">
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile kart listesi */}
      <div className="lg:hidden divide-y divide-slate-700/30">
        {projects.map((project) => {
          const prog = computeProjectProgress(project);
          return (
            <div
              key={project.id}
              className="px-4 py-4 hover:bg-slate-700/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className="w-2 h-6 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: project.coverColor ?? '#6366f1' }}
                  />
                  <div className="min-w-0">
                    <p className="text-slate-200 font-medium truncate">{project.title}</p>
                    <p className="text-slate-500 text-xs">{project.clientName}</p>
                  </div>
                </div>
                <Badge
                  label={PROJECT_STATUS_LABELS[project.status]}
                  className={`${PROJECT_STATUS_COLORS[project.status]} shrink-0`}
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {prog.totalCasts} cast
                </span>
                {prog.totalLines > 0 && (
                  <span className="flex items-center gap-1">
                    <FileAudio className="w-3 h-3" />
                    {prog.completedLines}/{prog.totalLines} replik
                  </span>
                )}
                <span className="ml-auto">{formatRelativeDate(project.updatedAt)}</span>
              </div>

              <LinearProgress
                percent={prog.progressPercent}
                height={5}
                showLabel
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
