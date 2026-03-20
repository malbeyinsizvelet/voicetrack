// CastListHeader – stub
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Character, Task, CharacterPriority } from '../../types';

export type CastFilterPriority = CharacterPriority | 'all';
export type CastFilterAssignment = 'all' | 'assigned' | 'unassigned';
export type CastSortKey = 'order' | 'name' | 'priority' | 'progress';

export interface CastFilters {
  search: string;
  priority: CastFilterPriority;
  assignment: CastFilterAssignment;
  sort: CastSortKey;
}

interface Props {
  characters?: Character[];
  tasks?: Task[];
  filters?: CastFilters;
  onFiltersChange?: (f: CastFilters) => void;
  onChange?: (f: CastFilters) => void;
  canWrite?: boolean;
  onAddCharacter?: () => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  totalCount?: number;
  filteredCount?: number;
}

export function CastListHeader({ filters, onFiltersChange, onChange, canWrite, onAddCharacter, showFilters, onToggleFilters }: Props) {
  const handleChange = onFiltersChange ?? onChange ?? (() => {});
  const currentFilters = filters ?? { search: '', priority: 'all', assignment: 'all', sort: 'order' };
  const set = <K extends keyof CastFilters>(key: K, val: CastFilters[K]) => handleChange({ ...currentFilters, [key]: val });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Karakter ara…"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        <button onClick={onToggleFilters} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
          style={{ background: showFilters ? 'var(--bg-active)' : 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filtrele
        </button>
        {canWrite && (
          <Button leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={onAddCharacter}>Karakter Ekle</Button>
        )}
      </div>
    </div>
  );
}
