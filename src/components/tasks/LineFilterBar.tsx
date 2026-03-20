// ============================================================
// LINE FILTER BAR — Phase 11
// TaskDetailPanel içi replik listesi filtresi.
// Arama + durum + kayıt varlığı + sıralama.
// ============================================================

import { useRef } from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import type { LineFilter, LineStatus } from '../../types';
import { DEFAULT_LINE_FILTER } from '../../services/filterService';

// ─── Line durum renk + etiket ─────────────────────────────────
const LINE_STATUS_OPTIONS: {
  value: LineStatus | 'all';
  label: string;
  dot: string;
}[] = [
  { value: 'all',      label: 'Tümü',    dot: 'bg-slate-500' },
  { value: 'pending',  label: 'Bekliyor', dot: 'bg-amber-400' },
  { value: 'recorded', label: 'Yüklendi', dot: 'bg-blue-400'  },
  { value: 'approved', label: 'Onaylı',   dot: 'bg-emerald-400'},
  { value: 'rejected', label: 'Reddedildi',dot: 'bg-red-400'  },
  { value: 'retake',   label: 'Retake',   dot: 'bg-orange-400'},
];

interface Props {
  filter: LineFilter;
  onChange: (f: LineFilter) => void;
  totalLines: number;
  filteredLines: number;
}

export function LineFilterBar({ filter, onChange, totalLines, filteredLines }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof LineFilter>(key: K, value: LineFilter[K]) {
    onChange({ ...filter, [key]: value });
  }

  const hasSearch = filter.search.trim() !== '';
  const isFiltered = hasSearch || filter.status !== 'all' || filter.hasRecorded !== null;

  return (
    <div className="space-y-2">
      {/* Üst satır */}
      <div className="flex items-center gap-2">
        {/* Arama */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            ref={searchRef}
            value={filter.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Satır no, metin, timecode..."
            className="w-full pl-7 pr-7 py-1.5 bg-slate-900/80 border border-slate-700/60
                       rounded-lg text-slate-300 text-xs placeholder-slate-600
                       focus:outline-none focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/60"
          />
          {hasSearch && (
            <button
              onClick={() => set('search', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sıralama toggle */}
        <button
          onClick={() =>
            set('sort', filter.sort === 'number' ? 'status' : 'number')
          }
          title={filter.sort === 'number' ? 'Sırala: Satır No' : 'Sırala: Durum'}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700/60
                     text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs transition-colors"
        >
          <ArrowUpDown className="w-3 h-3" />
          <span className="hidden sm:inline">
            {filter.sort === 'number' ? 'No' : 'Durum'}
          </span>
        </button>

        {/* Temizle */}
        {isFiltered && (
          <button
            onClick={() => onChange({ ...DEFAULT_LINE_FILTER })}
            className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Sonuç sayısı */}
        <span className="text-[11px] text-slate-600 shrink-0">
          {isFiltered ? `${filteredLines}/${totalLines}` : `${totalLines} satır`}
        </span>
      </div>

      {/* Durum pill'leri */}
      <div className="flex flex-wrap gap-1.5">
        {LINE_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => set('status', opt.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium
                        border transition-colors ${
              filter.status === opt.value
                ? 'border-indigo-500/60 bg-indigo-500/15 text-indigo-300'
                : 'border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
            {opt.label}
          </button>
        ))}

        {/* Kayıt varlığı */}
        <div className="border-l border-slate-700/60 mx-0.5" />
        <button
          onClick={() => set('hasRecorded', filter.hasRecorded === true ? null : true)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
            filter.hasRecorded === true
              ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-700/60 text-slate-500 hover:text-slate-300'
          }`}
        >
          Kaydı Olan
        </button>
        <button
          onClick={() => set('hasRecorded', filter.hasRecorded === false ? null : false)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
            filter.hasRecorded === false
              ? 'border-amber-500/60 bg-amber-500/10 text-amber-300'
              : 'border-slate-700/60 text-slate-500 hover:text-slate-300'
          }`}
        >
          Kaydı Olmayan
        </button>
      </div>
    </div>
  );
}
