// TaskCard – stub
import type { Task } from '../../types';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from '../../utils/formatters';

interface Props {
  task: Task;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TaskCard({ task, isSelected, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-xl border cursor-pointer transition-colors"
      style={{
        background: isSelected ? 'var(--bg-active)' : 'var(--bg-surface)',
        borderColor: isSelected ? 'var(--border-strong)' : 'var(--border)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{task.characterName}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${TASK_STATUS_COLORS[task.status] ?? ''}`}>
          {TASK_STATUS_LABELS[task.status] ?? task.status}
        </span>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.lineCount ?? 0} replik</p>
    </div>
  );
}
