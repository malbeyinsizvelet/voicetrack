// ============================================================
// MY TASKS PAGE
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import {
  Mic2, Upload, Download, CheckCircle2, AlertTriangle,
  RefreshCw, FileAudio, Search, Filter, ChevronUp, ChevronDown, Clock,
} from 'lucide-react';
import { TopBar }           from '../components/layout/TopBar';
import { Card }             from '../components/ui/Card';
import { Badge }            from '../components/ui/Badge';
import { Button }           from '../components/ui/Button';
import { EmptyState }       from '../components/ui/EmptyState';
import { TaskDetailPanel }  from '../components/tasks/TaskDetailPanel';
import { useProjects }      from '../context/ProjectContext';
import { useAuth }          from '../context/AuthContext';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  formatRelativeDate,
} from '../utils/formatters';
import type { MyTask, AudioFile, TaskStatus } from '../types';

type StatusFilter = TaskStatus | 'all';
type SortKey = 'priority' | 'updated' | 'project' | 'status';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',         label: 'Tümü' },
  { value: 'pending',     label: 'Bekliyor' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'uploaded',    label: 'Yüklendi' },
  { value: 'qc_approved', label: 'Onaylandı' },
  { value: 'qc_rejected', label: 'Reddedildi' },
];

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 0, high: 1, normal: 2, low: 3,
};
const STATUS_ORDER: Record<TaskStatus, number> = {
  qc_rejected: 0, pending: 1, in_progress: 2,
  uploaded: 3, qc_approved: 4, mixed: 5, final: 6,
};

function deriveMyTasks(
  projects: ReturnType<typeof useProjects>['projects'],
  artistId: string
): MyTask[] {
  const result: MyTask[] = [];
  for (const project of projects) {
    for (const task of project.tasks ?? []) {
      if (task.assignedTo !== artistId) continue;
      const character = project.characters.find((c) => c.id === task.characterId);
      result.push({
        ...task,
        projectTitle: project.title,
        projectColor: project.coverColor ?? '#6B7280',
        clientName: project.clientName,
        characterDescription: character?.description,
        voiceNotes: character?.voiceNotes,
        characterGender: character?.gender,
        characterPriority: character?.priority,
      });
    }
  }
  return result.sort((a, b) => {
    const pa = PRIORITY_WEIGHT[a.characterPriority ?? 'normal'] ?? 2;
    const pb = PRIORITY_WEIGHT[b.characterPriority ?? 'normal'] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
      <span className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

export function MyTasks() {
  const { projects, isLoading, uploadRecording } = useProjects();
  const { currentUser } = useAuth();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MyTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const allTasks = useMemo(
    () => (currentUser ? deriveMyTasks(projects, currentUser.id) : []),
    [projects, currentUser]
  );

  const filtered = useMemo(() => {
    let list = allTasks;
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.characterName.toLowerCase().includes(q) ||
          t.projectTitle.toLowerCase().includes(q) ||
          t.clientName?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'priority') {
        cmp = (PRIORITY_WEIGHT[a.characterPriority ?? 'normal'] ?? 2) -
              (PRIORITY_WEIGHT[b.characterPriority ?? 'normal'] ?? 2);
      } else if (sortKey === 'updated') {
        cmp = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortKey === 'project') {
        cmp = a.projectTitle.localeCompare(b.projectTitle);
      } else if (sortKey === 'status') {
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [allTasks, statusFilter, search, sortKey, sortAsc]);

  const counts = useMemo(() => ({
    pending:    allTasks.filter((t) => t.status === 'pending').length,
    inProgress: allTasks.filter((t) => t.status === 'in_progress').length,
    uploaded:   allTasks.filter((t) => t.status === 'uploaded').length,
    rejected:   allTasks.filter((t) => t.status === 'qc_rejected').length,
    done:       allTasks.filter((t) => ['qc_approved', 'final', 'mixed'].includes(t.status)).length,
  }), [allTasks]);

  const rejectedTasks = useMemo(() => allTasks.filter((t) => t.status === 'qc_rejected'), [allTasks]);

  const handleTaskClick = useCallback((task: MyTask) => {
    setSelectedTask(task);
    setPanelOpen(true);
  }, []);

  const handleUpload = useCallback(async (taskId: string, projectId: string, file: AudioFile) => {
    await uploadRecording(projectId, taskId, file);
  }, [uploadRecording]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : null;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Görevlerim" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Görevlerim"
        subtitle={`${allTasks.length} görev atandı`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara…"
                className="pl-8 pr-3 py-1.5 text-sm rounded-xl outline-none w-44"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-base)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Filter size={13} />}
              onClick={() => setShowFilters((v) => !v)}
            >
              Filtre
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          <SummaryPill label="Bekliyor"   value={counts.pending} />
          <SummaryPill label="Devam"      value={counts.inProgress} />
          <SummaryPill label="Yüklendi"   value={counts.uploaded} />
          <SummaryPill label="Reddedildi" value={counts.rejected} />
          <SummaryPill label="Tamamlandı" value={counts.done} />
        </div>

        {/* QC band */}
        {rejectedTasks.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
          >
            <AlertTriangle size={16} className="shrink-0" style={{ color: 'var(--text-primary)' }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {rejectedTasks.length} görev reddedildi
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                QC yönetmeninin notlarını okuyun ve kaydı tekrar yükleyin.
              </p>
            </div>
            <button
              onClick={() => setStatusFilter('qc_rejected')}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Göster
            </button>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  background: statusFilter === opt.value ? 'var(--text-primary)' : 'var(--bg-elevated)',
                  color: statusFilter === opt.value ? 'var(--bg-base)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-base)',
                }}
              >
                {opt.label}
              </button>
            ))}
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>Sırala:</span>
            {(['priority', 'updated', 'project', 'status'] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => handleSort(k)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  background: sortKey === k ? 'var(--bg-elevated)' : 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-base)',
                }}
              >
                {k === 'priority' ? 'Öncelik' : k === 'updated' ? 'Tarih' : k === 'project' ? 'Proje' : 'Durum'}
                <SortIcon k={k} />
              </button>
            ))}
          </div>
        )}

        {/* Task list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Mic2 size={32} />}
            title="Görev bulunamadı"
            description="Filtrelerinizi değiştirin veya yöneticinizden görev atanmasını bekleyin."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: task.projectColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {task.characterName}
                    </p>
                    {task.characterPriority && task.characterPriority !== 'normal' && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {task.characterPriority}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {task.projectTitle} · {task.clientName}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {task.lineCount !== undefined && (
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      {task.lineCount} replik
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: `${TASK_STATUS_COLORS[task.status]}20`,
                      color: TASK_STATUS_COLORS[task.status],
                    }}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatRelativeDate(task.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          isOpen={panelOpen}
          onClose={() => { setPanelOpen(false); setSelectedTask(null); }}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}
