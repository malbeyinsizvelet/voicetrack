// ============================================================
// CAST LIST HEADER — Phase 4
// Cast tab üst bölümü: özet stat row + arama + filtreler.
// ============================================================

import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Character, Task, CharacterPriority } from '../../types';

// ─── Derived Stats ────────────────────────────────────────────
interface CastStats {
  total: number;
  assigned: number;
  totalLines: number;
  completedLines: number;
  avgProgress: number;
}

function computeStats(characters: Character[], tasks: Task[]): CastStats {
  const total = characters.length;
  const assigned = characters.filter((c) => c.assignedArtistId).length;
  const totalLines = characters.reduce((s, c) => s + (c.lineCount ?? tasks.find(t => t.id === c.taskId)?.lineCount ?? 0), 0);
  const completedLines = characters.reduce((s, c) => s + (c.completedCount ?? 0), 0);
  const avgProgress = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;
  return { total, assigned, totalLines, completedLines, avgProgress };
}

// ─── Stat Pill ────────────────────────────────────────────────
function StatPill({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-xl px-4 py-2.5 min-w-[80px]">
      <span className={`text-lg font-bold ${accent ?? 'text-slate-200'}`}>{value}</span>
      <span className="text-[10px] text-slate-600 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── Filter types ─────────────────────────────────────────────
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
  characters: Character[];
  tasks: Task[];
  filters: CastFilters;
  onFiltersChange: (f: CastFilters) => void;
  canWrite: boolean;
  onAddCharacter: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

// ─── Component ────────────────────────────────────────────────
export function CastListHeader({
  characters,
  tasks,
  filters,
  onFiltersChange,
  canWrite,
  onAddCharacter,
  showFilters,
  onToggleFilters,
}: Props) {
  const stats = computeStats(characters, tasks);

  const set = <K extends keyof CastFilters>(key: K, val: CastFilters[K]) =>
    onFiltersChange({ ...filters, [key]: val });

  return (
    <div className="space-y-4">
      {/* ── Stat row ─────────────────────────────────────────── */}
      {characters.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <StatPill label="Toplam Cast" value={stats.total} accent="text-indigo-400" />
          <StatPill
            label="Atanmış"
            value={`${stats.assigned}/${stats.total}`}
            accent={stats.assigned === stats.total ? 'text-emerald-400' : 'text-amber-400'}
          />
          {stats.totalLines > 0 && (
            <>
              <StatPill label="Toplam Replik" value={stats.totalLines} />
              <StatPill
                label="Tamamlanan"
                value={stats.completedLines}
                accent="text-emerald-400"
              />
              <StatPill
                label="Ortalama"
                value={`${stats.avgProgress}%`}
                accent={
                  stats.avgProgress >= 80
                    ? 'text-emerald-400'
                    : stats.avgProgress >= 40
                    ? 'text-amber-400'
                    : 'text-red-400'
                }
              />
            </>
          )}
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Karakter ara…"
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
            showFilters
              ? 'bg-indigo-600/20 border-indigo-600/40 text-indigo-400'
              : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtrele
        </button>

        {/* Add character */}
        {canWrite && (
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onAddCharacter}
          >
            Karakter Ekle
          </Button>
        )}
      </div>

      {/* ── Expanded Filters ─────────────────────────────────── */}
      {showFilters && (
        <div className="flex gap-3 flex-wrap bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
          {/* Priority filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 uppercase tracking-wider">Öncelik</label>
            <div className="flex gap-1">
              {(['all', 'critical', 'high', 'normal', 'low'] as CastFilterPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => set('priority', p)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    filters.priority === p
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p === 'all' ? 'Tümü' : p === 'critical' ? 'Kritik' : p === 'high' ? 'Yüksek' : p === 'normal' ? 'Normal' : 'Düşük'}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 uppercase tracking-wider">Atama Durumu</label>
            <div className="flex gap-1">
              {(['all', 'assigned', 'unassigned'] as CastFilterAssignment[]).map((a) => (
                <button
                  key={a}
                  onClick={() => set('assignment', a)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    filters.assignment === a
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {a === 'all' ? 'Tümü' : a === 'assigned' ? 'Atanmış' : 'Atanmamış'}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 uppercase tracking-wider">Sıralama</label>
            <div className="flex gap-1">
              {([
                { key: 'order', label: 'Varsayılan' },
                { key: 'name', label: 'Ad' },
                { key: 'priority', label: 'Öncelik' },
                { key: 'progress', label: 'İlerleme' },
              ] as { key: CastSortKey; label: string }[]).map((s) => (
                <button
                  key={s.key}
                  onClick={() => set('sort', s.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    filters.sort === s.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
