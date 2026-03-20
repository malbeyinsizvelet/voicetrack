import {
  Clock, FileAudio, Upload as UploadIcon, Mic2,
  ChevronRight, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { SearchHighlight } from './SearchHighlight';
import type { Task } from '../../types';
import { TASK_STATUS_LABELS, formatDate } from '../../utils/formatters';

interface Props {
  task: Task;
  onClick: (task: Task) => void;
  isSelected?: boolean;
  searchQuery?: string;
}

function LineMiniBar({ task }: { task: Task }) {
  const lines = task.lines ?? [];
  if (lines.length === 0) return null;
  const approved = lines.filter((l) => l.status === 'approved').length;
  const recorded = lines.filter((l) => l.status === 'recorded').length;
  const rejected = lines.filter((l) => l.status === 'rejected').length;
  const total = lines.length;
  const pct = Math.round((approved / total) * 100);

  return (
    <div className="flex items-center gap-2 mt-2">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden flex"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div className="h-full transition-all duration-500"
             style={{ width: `${(approved / total) * 100}%`, background: 'var(--progress-fill)' }} />
        <div className="h-full transition-all duration-500"
             style={{ width: `${(recorded / total) * 100}%`, background: 'var(--text-secondary)' }} />
        <div className="h-full transition-all duration-500"
             style={{ width: `${(rejected / total) * 100}%`, background: 'var(--border-strong)' }} />
      </div>
      <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
        {approved}/{total} · %{pct}
      </span>
    </div>
  );
}

// task status → style
function taskBorderStyle(task: Task, isSelected: boolean): React.CSSProperties {
  if (isSelected) return {
    background: 'var(--bg-active)',
    border: '1px solid var(--border-strong)',
  };
  const hasIssues = (task.lines ?? []).some((l) => l.status === 'rejected');
  return {
    background: hasIssues ? 'var(--bg-hover)' : 'var(--bg-surface)',
    border: '1px solid var(--border)',
  };
}

export function TaskCard({ task, onClick, isSelected = false, searchQuery = '' }: Props) {
  const lines = task.lines ?? [];
  const rejectedLines = lines.filter((l) => l.status === 'rejected').length;
  const pendingLines  = lines.filter((l) => l.status === 'pending').length;
  const hasIssues = rejectedLines > 0;

  return (
    <button
      onClick={() => onClick(task)}
      className="w-full text-left rounded-xl px-4 py-3.5 transition-all group"
      style={taskBorderStyle(task, isSelected)}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Sol: isim + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <SearchHighlight
              text={task.characterName}
              query={searchQuery}
              className="text-sm font-medium"
            />
            {hasIssues && (
              <span className="flex items-center gap-0.5 text-[11px]"
                    style={{ color: 'var(--text-secondary)' }}>
                <AlertCircle className="w-3 h-3" />
                {rejectedLines} red
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {task.assignedArtistName}
            </span>

            {task.lineCount > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Mic2 className="w-3 h-3" />
                {task.lineCount} replik
              </span>
            )}

            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          <LineMiniBar task={task} />
        </div>

        {/* Sağ: dosya sayıları + durum + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {task.sourceFiles.length > 0 && (
              <span className="flex items-center gap-1" title="Kaynak dosya">
                <FileAudio className="w-3.5 h-3.5" />
                {task.sourceFiles.length}
              </span>
            )}
            {task.recordedFiles.length > 0 && (
              <span className="flex items-center gap-1" title="Kayıt dosyası">
                <UploadIcon className="w-3.5 h-3.5" />
                {task.recordedFiles.length}
              </span>
            )}
            {lines.length > 0 && pendingLines === 0 && (
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
            )}
          </div>

          {/* Durum badge */}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {TASK_STATUS_LABELS[task.status]}
          </span>

          <ChevronRight
            className="w-4 h-4 transition-transform"
            style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)' }}
          />
        </div>
      </div>
    </button>
  );
}
