// TaskDetailPanel – stub (gerçek implementasyon GitHub'dan)
import type { Task, Project } from '../../types';

interface Props {
  task: Task;
  project: Project;
  onClose: () => void;
  onUploadDone?: (lineId: string, audioFileId: string) => Promise<void>;
}

export function TaskDetailPanel({ task, onClose }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-semibold text-sm">{task.characterName}</h3>
        <button onClick={onClose} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)' }}>✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{task.lineCount ?? 0} replik</p>
      </div>
    </div>
  );
}
