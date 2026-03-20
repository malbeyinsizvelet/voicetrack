// ============================================================
// STAGING BAR – Ekranın altında sabit "N dosya hazır" çubuğu
// ============================================================

import { useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  FileAudio,
  Mic2,
} from 'lucide-react';
import { useStaging } from '../../context/StagingContext';
import { isStorageEnabled } from '../../config/storage.config';
import type { StagedItem } from '../../services/stagingService';
import { formatFileSize } from '../../services/audioUploadService';

function StatusIcon({ status }: { status: StagedItem['status'] }) {
  if (status === 'staged') {
    return (
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: 'var(--text-muted)' }}
      />
    );
  }
  if (status === 'committing') {
    return <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />;
  }
  if (status === 'committed') {
    return <CheckCircle2 size={12} style={{ color: 'var(--text-primary)' }} />;
  }
  return <XCircle size={12} style={{ color: 'var(--text-primary)' }} />;
}

function StagedItemRow({
  item,
  onRemove,
}: {
  item: StagedItem;
  onRemove: (uid: string) => void;
}) {
  const canRemove = item.status === 'staged' || item.status === 'error';
  const Icon = item.type === 'source' ? FileAudio : Mic2;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
      style={{
        background: item.status === 'error' ? 'var(--bg-elevated)' : 'transparent',
      }}
    >
      <Icon size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

      <span
        className="flex-1 truncate"
        style={{
          color: item.status === 'error' ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
        title={item.fileName}
      >
        {item.fileName}
      </span>

      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
        {formatFileSize(item.fileSize)}
      </span>

      <span className="flex items-center gap-1 flex-shrink-0">
        <span
          className="text-xs capitalize"
          style={{ color: 'var(--text-muted)' }}
        >
          {item.type === 'source' ? 'Kaynak' : 'Kayıt'}
        </span>
        <StatusIcon status={item.status} />
      </span>

      {item.status === 'error' && item.errorMessage && (
        <span
          className="text-xs truncate max-w-[120px]"
          style={{ color: 'var(--text-muted)' }}
          title={item.errorMessage}
        >
          {item.errorMessage}
        </span>
      )}

      {canRemove && (
        <button
          onClick={() => onRemove(item.uid)}
          className="flex-shrink-0 p-0.5 rounded transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
          title="Kuyruktan çıkar"
          type="button"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

export function StagingBar() {
  const {
    queue,
    pendingCount,
    isCommitting,
    commitProgress,
    commitAll,
    unstage,
    clearCommitted,
    clearErrors,
  } = useStaging();

  const [expanded, setExpanded] = useState(false);
  const [justFinished, setJustFinished] = useState(false);

  const stagedItems    = queue.filter((i) => i.status === 'staged');
  const committingItems = queue.filter((i) => i.status === 'committing');
  const committedItems = queue.filter((i) => i.status === 'committed');
  const errorItems     = queue.filter((i) => i.status === 'error');

  const totalBytes = stagedItems.reduce((s, i) => s + i.fileSize, 0);
  const hasAnything = queue.length > 0;

  useEffect(() => {
    if (!isCommitting && committedItems.length > 0 && pendingCount === 0) {
      setJustFinished(true);
      const t = setTimeout(() => {
        clearCommitted();
        setJustFinished(false);
        if (errorItems.length === 0) setExpanded(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [isCommitting, committedItems.length, pendingCount, clearCommitted, errorItems.length]);

  if (!hasAnything && !justFinished) return null;

  const storageEnabled = isStorageEnabled();

  const progressPct =
    isCommitting && commitProgress.total > 0
      ? Math.round((commitProgress.done / commitProgress.total) * 100)
      : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: 'var(--bg-sidebar)',
        borderColor: 'var(--border-base)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.3)',
      }}
    >
      {isCommitting && (
        <div className="h-0.5 bg-slate-700">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isCommitting ? (
            <Loader2 size={14} className="animate-spin shrink-0 text-indigo-400" />
          ) : committedItems.length > 0 && !isCommitting ? (
            <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
          ) : (
            <Upload size={14} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
          )}

          <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {isCommitting
              ? `Gönderiliyor… (${commitProgress.done}/${commitProgress.total})`
              : committedItems.length > 0 && !isCommitting
              ? `${committedItems.length} dosya gönderildi`
              : `${stagedItems.length} dosya hazır`}
          </span>

          {!isCommitting && stagedItems.length > 0 && (
            <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
              · {formatFileSize(totalBytes)}
            </span>
          )}

          {errorItems.length > 0 && (
            <span className="text-xs text-red-400 shrink-0">
              · {errorItems.length} hata
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {errorItems.length > 0 && !isCommitting && (
            <button
              onClick={clearErrors}
              className="text-xs px-2 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-base)' }}
              type="button"
            >
              Hataları Temizle
            </button>
          )}

          {stagedItems.length > 0 && !isCommitting && storageEnabled && (
            <button
              onClick={commitAll}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
              type="button"
            >
              <Upload size={12} />
              Toplu Gönder ({stagedItems.length})
            </button>
          )}

          {stagedItems.length > 0 && !isCommitting && !storageEnabled && (
            <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-base)' }}>
              Demo modu – depolama devre dışı
            </span>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            type="button"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="border-t max-h-48 overflow-y-auto px-2 py-1"
          style={{ borderColor: 'var(--border-base)' }}
        >
          {queue.map((item) => (
            <StagedItemRow key={item.uid} item={item} onRemove={unstage} />
          ))}
        </div>
      )}
    </div>
  );
}
