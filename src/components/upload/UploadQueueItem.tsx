// ============================================================
// UPLOAD QUEUE ITEM — Phase 7
// Yükleme kuyruğundaki tek bir dosyanın satır bileşeni.
// Durum, ilerleme, dosya bilgisi ve aksiyonlar gösterir.
// ============================================================

import { Music, CheckCircle2, XCircle, AlertTriangle, Copy, Loader2, X, SkipForward } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatFileSize } from '../../services/audioUploadService';
import type { UploadedFileEntry, UploadFileStatus } from '../../types';

// ─── Durum konfigürasyonu ────────────────────────────────────
const STATUS_CONFIG: Record<
  UploadFileStatus,
  { label: string; color: string; icon: React.ReactNode; progressColor: string }
> = {
  queued: {
    label: 'Sırada',
    color: 'text-slate-400',
    icon: <Music className="w-3.5 h-3.5" />,
    progressColor: 'bg-slate-500',
  },
  parsing: {
    label: 'Hazırlanıyor',
    color: 'text-indigo-400',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    progressColor: 'bg-indigo-500',
  },
  uploading: {
    label: 'Yükleniyor',
    color: 'text-indigo-400',
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    progressColor: 'bg-indigo-500',
  },
  done: {
    label: 'Tamamlandı',
    color: 'text-emerald-400',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    progressColor: 'bg-emerald-500',
  },
  error: {
    label: 'Hata',
    color: 'text-red-400',
    icon: <XCircle className="w-3.5 h-3.5" />,
    progressColor: 'bg-red-500',
  },
  duplicate: {
    label: 'Kopya',
    color: 'text-amber-400',
    icon: <Copy className="w-3.5 h-3.5" />,
    progressColor: 'bg-amber-500',
  },
  skipped: {
    label: 'Atlandı',
    color: 'text-slate-500',
    icon: <SkipForward className="w-3.5 h-3.5" />,
    progressColor: 'bg-slate-600',
  },
};

// ─── Süre formatı ────────────────────────────────────────────
function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Bileşen ─────────────────────────────────────────────────
interface UploadQueueItemProps {
  entry: UploadedFileEntry;
  index: number;
  onRemove?: (uid: string) => void;
  onSkip?: (uid: string) => void;
  isUploading: boolean;
}

export function UploadQueueItem({
  entry,
  index,
  onRemove,
  onSkip,
  isUploading,
}: UploadQueueItemProps) {
  const conf = STATUS_CONFIG[entry.status];
  const isActive = entry.status === 'uploading' || entry.status === 'parsing';
  const isDone = entry.status === 'done';
  const isError = entry.status === 'error';
  const isDuplicate = entry.status === 'duplicate';
  const isSkipped = entry.status === 'skipped';
  const isQueued = entry.status === 'queued';

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
        isDone && 'bg-emerald-900/10 border border-emerald-800/20',
        isError && 'bg-red-900/10 border border-red-800/20',
        isDuplicate && 'bg-amber-900/10 border border-amber-800/20',
        isSkipped && 'opacity-50',
        isActive && 'bg-indigo-900/10 border border-indigo-800/20',
        (isQueued) && 'bg-slate-800/30 border border-slate-700/20',
      )}
    >
      {/* ── Sıra No / İkon ───────────────────────────────── */}
      <div className="w-6 text-center shrink-0">
        {isActive ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin mx-auto" />
        ) : (
          <span className={cn('text-xs font-mono', conf.color)}>
            {(index + 1).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* ── Dosya Bilgisi ────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium truncate',
              isDone ? 'text-emerald-300' : isError ? 'text-red-300' : isSkipped ? 'text-slate-600' : 'text-slate-200'
            )}
            title={entry.fileName}
          >
            {entry.fileName}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-0.5">
          {/* Boyut */}
          <span className="text-[10px] text-slate-500 font-mono">
            {formatFileSize(entry.fileSize)}
          </span>

          {/* Tahmini süre */}
          {entry.estimatedDuration && (
            <span className="text-[10px] text-slate-600 font-mono">
              ~{formatDuration(entry.estimatedDuration)}
            </span>
          )}

          {/* Durum badge */}
          <span className={cn('flex items-center gap-1 text-[10px] font-medium', conf.color)}>
            {conf.icon}
            {conf.label}
          </span>

          {/* Hata mesajı */}
          {entry.errorMessage && (
            <span className="text-[10px] text-red-400 truncate max-w-[200px]" title={entry.errorMessage}>
              — {entry.errorMessage}
            </span>
          )}
        </div>

        {/* ── Progress Bar ──────────────────────────────── */}
        {(isActive || isDone) && (
          <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', conf.progressColor)}
              style={{ width: `${entry.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Aksiyonlar ───────────────────────────────────── */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Duplicate → skip */}
        {isDuplicate && !isUploading && onSkip && (
          <button
            onClick={() => onSkip(entry.uid)}
            title="Atla"
            className="p-1 rounded text-amber-500 hover:bg-amber-900/30 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Queued / Error → remove */}
        {(isQueued || isError || isDuplicate) && !isUploading && onRemove && (
          <button
            onClick={() => onRemove(entry.uid)}
            title="Kaldır"
            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Done / Skipped → yalnızca durum göster */}
        {(isDone || isSkipped) && (
          <span className={cn('w-5 h-5 flex items-center justify-center', conf.color)}>
            {conf.icon}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Özet istatistik satırı ──────────────────────────────────
interface UploadSummaryProps {
  entries: UploadedFileEntry[];
}

export function UploadSummary({ entries }: UploadSummaryProps) {
  const total = entries.length;
  const done = entries.filter((e) => e.status === 'done').length;
  const errors = entries.filter((e) => e.status === 'error').length;
  const duplicates = entries.filter((e) => e.status === 'duplicate').length;
  const skipped = entries.filter((e) => e.status === 'skipped').length;
  const queued = entries.filter((e) => e.status === 'queued').length;
  const uploading = entries.filter((e) => e.status === 'uploading' || e.status === 'parsing').length;

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/40">
      <Pill color="text-slate-400" label="Toplam" value={total} />
      {queued > 0 && <Pill color="text-slate-400" label="Sırada" value={queued} />}
      {uploading > 0 && <Pill color="text-indigo-400" label="Yükleniyor" value={uploading} />}
      {done > 0 && <Pill color="text-emerald-400" label="Tamamlandı" value={done} />}
      {errors > 0 && <Pill color="text-red-400" label="Hata" value={errors} />}
      {duplicates > 0 && <Pill color="text-amber-400" label="Kopya" value={duplicates} />}
      {skipped > 0 && <Pill color="text-slate-500" label="Atlandı" value={skipped} />}
    </div>
  );
}

function Pill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className={cn('flex items-center gap-1 text-xs', color)}>
      <span className="font-bold text-sm">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  );
}

// ─── Uyarı satırı ────────────────────────────────────────────
export function DuplicateWarning({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-900/20 border border-amber-800/30 rounded-xl">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <p className="text-amber-300 text-xs">
        <span className="font-semibold">{count} kopya dosya</span> var. Bu dosyalar atlanacak veya üzerine yazılacak.
        Devam etmek için üst üste yükle ya da kaldır.
      </p>
    </div>
  );
}
