// ============================================================
// TASK FILTER BAR — Phase 11
// Görev listesi için: arama + durum + replik durum + kayıt
// varlığı + sıralama + aktif filtre badge'i + temizle.
// Hem ProjectDetail TasksTab hem MyTasks sayfasında kullanılır.
// ============================================================

import { useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from 'lucide-react';
import type { TaskFilter, TaskStatus, LineStatus, TaskSortKey } from '../../types';
import { countActiveFilters, DEFAULT_TASK_FILTER } from '../../services/filterService';
import { TASK_STATUS_LABELS } from '../../utils/formatters';

// ─── Props ────────────────────────────────────────────────────
interface Props {
  filter: TaskFilter;
  onChange: (f: TaskFilter) => void;
  totalCount: number;
  filteredCount: number;
  showFilters: boolean;
  onToggleFilters: () => void;
  /** Sanatçı modunda durum seçenekleri kısıtlanır */
  artistMode?: boolean;
}

// ─── Sabit seçenek listeleri ──────────────────────────────────

const TASK_STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all',         label: 'Tüm Durumlar' },
  { value: 'pending',     label: 'Bekliyor' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'uploaded',    label: 'Yüklendi' },
  { value: 'qc_approved', label: 'Onaylandı' },
  { value: 'qc_rejected', label: 'Reddedildi' },
  { value: 'mixed',       label: 'Mix Tamamlandı' },
  { value: 'final',       label: 'Final' },
];

const LINE_STATUS_OPTIONS: { value: LineStatus | 'all'; label: string; color: string }[] = [
  { value: 'all',      label: 'Tüm Replikler',    color: 'text-slate-400' },
  { value: 'pending',  label: 'Bekleyen Replik',  color: 'text-amber-400' },
  { value: 'recorded', label: 'Yüklenen Replik',  color: 'text-blue-400' },
  { value: 'approved', label: 'Onaylı Replik',    color: 'text-emerald-400' },
  { value: 'rejected', label: 'Reddedilen Replik',color: 'text-red-400' },
  { value: 'retake',   label: 'Retake Bekleyen',  color: 'text-orange-400' },
];

const SORT_OPTIONS: { value: TaskSortKey; label: string }[] = [
  { value: 'character', label: 'Karakter Adı' },
  { value: 'status',    label: 'Durum' },
  { value: 'progress',  label: 'İlerleme' },
  { value: 'updated',   label: 'Son Güncelleme' },
  { value: 'lines',     label: 'Replik Sayısı' },
];

// ─── Pill buton ───────────────────────────────────────────────
function Pill({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? 'bg-indigo-600 border-indigo-500 text-white'
          : `border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 ${color ?? ''}`
      }`}
    >
      {children}
    </button>
  );
}

// ─── Bölüm başlığı ───────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
      {children}
    </span>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────
export function TaskFilterBar({
  filter,
  onChange,
  totalCount,
  filteredCount,
  showFilters,
  onToggleFilters,
  artistMode = false,
}: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+F odağı
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activeCount = countActiveFilters(filter);
  const hasSearch   = filter.search.trim() !== '';
  const isFiltered  = activeCount > 0 || hasSearch;

  function set<K extends keyof TaskFilter>(key: K, value: TaskFilter[K]) {
    onChange({ ...filter, [key]: value });
  }

  function toggleSort(key: TaskSortKey) {
    if (filter.sort === key) {
      set('sortDir', filter.sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onChange({ ...filter, sort: key, sortDir: 'asc' });
    }
  }

  function clearAll() {
    onChange({ ...DEFAULT_TASK_FILTER });
  }

  const statusOptions = artistMode
    ? TASK_STATUS_OPTIONS.filter(
        (o) => !['mixed', 'final'].includes(o.value)
      )
    : TASK_STATUS_OPTIONS;

  return (
    <div className="space-y-2">
      {/* ── Üst satır: arama + toggle + özet ──────────────── */}
      <div className="flex items-center gap-2">
        {/* Arama kutusu */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            ref={searchRef}
            value={filter.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder={
              artistMode
                ? 'Karakter, replik, proje ara... (Ctrl+F)'
                : 'Karakter, dosya adı, replik ara... (Ctrl+F)'
            }
            className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700
                       rounded-lg text-slate-300 text-sm placeholder-slate-600
                       focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500
                       transition-colors"
          />
          {hasSearch && (
            <button
              onClick={() => set('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtre toggle butonu */}
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm
                      transition-colors relative ${
            showFilters
              ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
              : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtre</span>
          {showFilters
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />}
          {/* Aktif filtre sayısı badge */}
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white
                             text-[9px] font-bold rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Temizle */}
        {isFiltered && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-slate-700
                       text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Temizle</span>
          </button>
        )}

        {/* Sonuç sayısı */}
        <span className="text-xs text-slate-600 ml-auto">
          {isFiltered
            ? `${filteredCount} / ${totalCount} görev`
            : `${totalCount} görev`}
        </span>
      </div>

      {/* ── Genişletilmiş filtre paneli ───────────────────── */}
      {showFilters && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-4">

          {/* Görev Durumu */}
          <div className="space-y-2">
            <SectionLabel>Görev Durumu</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((opt) => (
                <Pill
                  key={opt.value}
                  active={filter.status === opt.value}
                  onClick={() => set('status', opt.value)}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-700/50" />

          {/* Replik Durumu */}
          <div className="space-y-2">
            <SectionLabel>Replik Durumuna Göre</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {LINE_STATUS_OPTIONS.map((opt) => (
                <Pill
                  key={opt.value}
                  active={filter.lineStatus === opt.value}
                  onClick={() => set('lineStatus', opt.value)}
                  color={opt.color}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-700/50" />

          {/* Hızlı Filtreler */}
          <div className="flex flex-wrap gap-4 items-start">
            <div className="space-y-2">
              <SectionLabel>Hızlı Filtreler</SectionLabel>
              <div className="flex gap-1.5">
                <Pill
                  active={filter.hasRecorded === true}
                  onClick={() =>
                    set('hasRecorded', filter.hasRecorded === true ? null : true)
                  }
                >
                  Kaydı Olan
                </Pill>
                <Pill
                  active={filter.hasRecorded === false}
                  onClick={() =>
                    set('hasRecorded', filter.hasRecorded === false ? null : false)
                  }
                >
                  Kaydı Olmayan
                </Pill>
              </div>
            </div>

            <div className="space-y-2">
              <SectionLabel>Bekleyen Replik</SectionLabel>
              <div className="flex gap-1.5">
                <Pill
                  active={filter.hasPending === true}
                  onClick={() =>
                    set('hasPending', filter.hasPending === true ? null : true)
                  }
                >
                  Var
                </Pill>
                <Pill
                  active={filter.hasPending === false}
                  onClick={() =>
                    set('hasPending', filter.hasPending === false ? null : false)
                  }
                >
                  Yok
                </Pill>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50" />

          {/* Sıralama */}
          <div className="space-y-2">
            <SectionLabel>Sıralama</SectionLabel>
            <div className="flex flex-wrap gap-1.5 items-center">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleSort(opt.value)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium
                              border transition-colors ${
                    filter.sort === opt.value
                      ? 'bg-slate-600 border-slate-500 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                  {filter.sort === opt.value && (
                    <ArrowUpDown
                      className={`w-3 h-3 transition-transform ${
                        filter.sortDir === 'desc' ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Aktif filtre etiketi özeti ─────────────────────── */}
      {(activeCount > 0) && (
        <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
          <span className="text-[10px] text-slate-600">Aktif:</span>
          {filter.status !== 'all' && (
            <ActiveFilterTag
              label={`Durum: ${TASK_STATUS_LABELS[filter.status as TaskStatus]}`}
              onRemove={() => set('status', 'all')}
            />
          )}
          {filter.lineStatus !== 'all' && (
            <ActiveFilterTag
              label={`Replik: ${LINE_STATUS_OPTIONS.find(o => o.value === filter.lineStatus)?.label}`}
              onRemove={() => set('lineStatus', 'all')}
            />
          )}
          {filter.hasRecorded === true && (
            <ActiveFilterTag label="Kayıt: Var" onRemove={() => set('hasRecorded', null)} />
          )}
          {filter.hasRecorded === false && (
            <ActiveFilterTag label="Kayıt: Yok" onRemove={() => set('hasRecorded', null)} />
          )}
          {filter.hasPending === true && (
            <ActiveFilterTag label="Bekleyen: Var" onRemove={() => set('hasPending', null)} />
          )}
          {filter.hasPending === false && (
            <ActiveFilterTag label="Bekleyen: Yok" onRemove={() => set('hasPending', null)} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Aktif filtre etiketi ─────────────────────────────────────
function ActiveFilterTag({
  label,
  onRemove,
}: {
  label?: string;
  onRemove: () => void;
}) {
  if (!label) return null;
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30
                     rounded-full text-[11px] text-indigo-300">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
