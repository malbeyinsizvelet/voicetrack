// TaskFilterBar – stub
import { Search } from 'lucide-react';
import type { TaskStatus } from '../../types';

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'all';
  sort: 'name' | 'status' | 'progress';
}

interface Props {
  filters: TaskFilters;
  onFiltersChange: (f: TaskFilters) => void;
  taskCount: number;
}

export function TaskFilterBar({ filters, onFiltersChange, taskCount }: Props) {
  const set = <K extends keyof TaskFilters>(key: K, val: TaskFilters[K]) =>
    onFiltersChange({ ...filters, [key]: val });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-40">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder={`${taskCount} görev ara…`}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  );
}
