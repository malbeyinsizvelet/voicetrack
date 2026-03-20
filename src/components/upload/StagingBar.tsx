// ============================================================
// STAGING BAR — Ekranın altında sabit "N dosya hazır" çubuğu
//
// Staged dosya varsa görünür, yoksa gizlenir.
// "Toplu Gönder" butonuyla commitAll() tetiklenir.
// Commit sonrası committed dosyalar 3 sn gösterilip bar kapanır.
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

// ─── Durum ikonu ─────────────────────────────────────────────
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

// ─── Tek satır item ──────────────────────────────────────────
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
        background: item.status === 'error'
          ? 'var(--bg-elevated)'
          : 'transparent',
      }}
    >
      <Icon size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

      <span
        className="flex-1 truncate"
        style={{
          color: item.status === 'error'
            ? 'var(--text-primary)'
            : 'var(--text-secondary)',
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

// ─── Ana bileşen ─────────────────────────────────────────────
export function StagingBar() {
  const {
    queue,
    pendingCount,
    isCommitting,
    commitProgress,
    batchProgress,
    commitAll,
    unstage,
    clearCommitted,
    clearErrors,
  } = useStaging();

  const [expanded, setExpanded]         = useState(false);
  const [justFinished, setJustFinished] = useState(false);

  const stagedItems    = queue.filter((i) => i.status === 'staged');
  const committingItems = queue.filter((i) => i.status === 'committing');
  const committedItems = queue.filter((i) => i.status === 'committed');
  const errorItems     = queue.filter((i) => i.status === 'error');

  const totalBytes = stagedItems.reduce((s, i) => s + i.fileSize, 0);
  const hasAnything = queue.length > 0;

  // Commit tamamlandıktan 3 sn sonra committed'ları temizle
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

  // ─── Progress bar (commit sırasında) ─────────────────────
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
      {/* Progress bar (commit sırasında) */}
      {isCommitting && (
        <div
          className="h-0.5 transition-all duration-300"
          style={{
            background: 'var(--border-strong)',
            width: '100%',
          }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              background: 'var(--text-primary)',
              width: `${progressPct}%`,
            }}
          />
        </div>
      )}

      {/* ── Bar başlığı ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5">

        {/* Sol: ikon + özet */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isCommitting ? (
            <Loader2 size={15} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-primary)' }} />
          ) : justFinished ? (
            <CheckCircle2 size={15} className="flex-shrink-0" style={{ color: 'var(--text-primary)' }} />
          ) : (
            <Upload size={15} className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
          )}

          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {isCommitting
              ? batchProgress && batchProgress.total > 1
                ? `Batch ${batchProgress.current}/${batchProgress.total} gönderiliyor… (${commitProgress.done}/${commitProgress.total} dosya)`
                : `Gönderiliyor… ${commitProgress.done}/${commitProgress.total}`
              : justFinished
              ? `${committedItems.length} dosya gönderildi`
              : `${stagedItems.length} dosya hazır`}
          </span>

          {!isCommitting && !justFinished && stagedItems.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ({formatFileSize(totalBytes)})
            </span>
          )}

          {errorItems.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              {errorItems.length} hata
            </span>
          )}

          {!storageEnabled && stagedItems.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded hidden sm:inline"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              Mock mod
            </span>
          )}
        </div>

        {/* Sağ: aksiyonlar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {errorItems.length > 0 && (
            <button
              onClick={clearErrors}
              className="text-xs px-2 py-1 rounded border transition-opacity hover:opacity-70"
              style={{
                color: 'var(--text-muted)',
                borderColor: 'var(--border-base)',
                background: 'transparent',
              }}
              type="button"
            >
              Hataları Temizle
            </button>
          )}

          {stagedItems.length > 0 && (
            <button
              onClick={() => commitAll()}
              disabled={isCommitting}
              className="text-xs font-medium px-3 py-1.5 rounded transition-opacity"
              style={{
                background: isCommitting ? 'var(--bg-elevated)' : 'var(--text-primary)',
                color: isCommitting ? 'var(--text-muted)' : 'var(--bg-sidebar)',
                opacity: isCommitting ? 0.6 : 1,
                cursor: isCommitting ? 'not-allowed' : 'pointer',
              }}
              type="button"
            >
              {isCommitting ? 'Gönderiliyor…' : 'Toplu Gönder'}
            </button>
          )}

          {/* Liste aç/kapat */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 rounded transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
            type="button"
            title={expanded ? 'Listeyi kapat' : 'Listeyi aç'}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* ── Genişletilmiş liste ──────────────────────────── */}
      {expanded && (
        <div
          className="border-t max-h-48 overflow-y-auto px-2 pb-2"
          style={{ borderColor: 'var(--border-base)' }}
        >
          {/* Staged */}
          {stagedItems.length > 0 && (
            <div className="mt-1">
              <p
                className="text-xs px-3 py-1 font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Gönderilmeyi Bekliyor ({stagedItems.length})
              </p>
              {stagedItems.map((item) => (
                <StagedItemRow key={item.uid} item={item} onRemove={unstage} />
              ))}
            </div>
          )}

          {/* Committing */}
          {committingItems.length > 0 && (
            <div className="mt-1">
              <p
                className="text-xs px-3 py-1 font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Gönderiliyor…
              </p>
              {committingItems.map((item) => (
                <StagedItemRow key={item.uid} item={item} onRemove={unstage} />
              ))}
            </div>
          )}

          {/* Committed */}
          {committedItems.length > 0 && (
            <div className="mt-1">
              <p
                className="text-xs px-3 py-1 font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Gönderildi ✓
              </p>
              {committedItems.map((item) => (
                <StagedItemRow key={item.uid} item={item} onRemove={() => {}} />
              ))}
            </div>
          )}

          {/* Error */}
          {errorItems.length > 0 && (
            <div className="mt-1">
              <p
                className="text-xs px-3 py-1 font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Hata ({errorItems.length})
              </p>
              {errorItems.map((item) => (
                <StagedItemRow key={item.uid} item={item} onRemove={unstage} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
