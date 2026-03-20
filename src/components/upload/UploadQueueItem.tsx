// ============================================================
// UPLOAD QUEUE ITEM – Phase 7
// ============================================================

import { Music, CheckCircle2, XCircle, AlertTriangle, Copy, Loader2, X, SkipForward } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatFileSize } from '../../services/audioUploadService';
import type { UploadedFileEntry, UploadFileStatus } from '../../types';

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

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '–';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface DuplicateWarning {
  uid: string;
  fileName: string;
}

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
      <div className="w-6 text-center shrink-0">
        {isActive ? (
          <Loader2 className="w-4 h-4 text-indigo-400 animate-spin mx-auto" />
        ) : (
          <span className={cn('text-xs font-mono', conf.color)}>
            {(index + 1).toString().padStart(2, '0')}
          </span>
        )}
      </div>

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
          <span className="text-[10px] text-slate-500 font-mono">
            {formatFileSize(entry.fileSize)}
          </span>

          {entry.estimatedDuration && (
            <span className="text-[10px] text-slate-600 font-mono">
              ~{formatDuration(entry.estimatedDuration)}
            </span>
          )}

          <span className={cn('flex items-center gap-1 text-[10px] font-medium', conf.color)}>
            {conf.icon}
            {conf.label}
          </span>

          {entry.errorMessage && (
            <span className="text-[10px] text-red-400 truncate max-w-[200px]" title={entry.errorMessage}>
              – {entry.errorMessage}
            </span>
          )}
        </div>

        {isActive && (
          <div className="mt-1.5 h-1 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', conf.progressColor)}
              style={{ width: `${entry.progress ?? 0}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isDuplicate && !isUploading && onSkip && (
          <button
            onClick={() => onSkip(entry.uid)}
            className="p-1 rounded text-slate-500 hover:text-amber-400 transition-colors"
            title="Atla"
            type="button"
          >
            <SkipForward size={12} />
          </button>
        )}
        {(isQueued || isDuplicate || isError) && !isUploading && onRemove && (
          <button
            onClick={() => onRemove(entry.uid)}
            className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Kuyruktan çıkar"
            type="button"
          >
            <X size={12} />
          </button>
        )}
        {isSkipped && (
          <AlertTriangle size={12} className="text-slate-600" />
        )}
      </div>
    </div>
  );
}
