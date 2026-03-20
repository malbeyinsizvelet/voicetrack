import { FileAudio, Mic2, Info } from 'lucide-react';
import { DownloadButton } from './DownloadButton';
import type { AudioFile, UserRole } from '../../types';
import { canDownloadSource, canDownloadRecorded } from '../../services/downloadService';
import { formatFileSize, formatDuration } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface Props {
  sourceFile?: AudioFile;
  recordedFile?: AudioFile;
  userRole: UserRole;
  userId: string;
  ownerId?: string;
  layout?: 'row' | 'cards';
  showMeta?: boolean;
  className?: string;
}

function FileMeta({ file, label }: { file: AudioFile; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-1">
      <span className="text-[var(--text-muted)]">{label}:</span>
      <span className="font-mono truncate text-[var(--text-secondary)]">{file.fileName}</span>
      <span className="shrink-0">{formatFileSize(file.fileSize)}</span>
      {file.duration && (
        <span className="shrink-0">{formatDuration(file.duration)}</span>
      )}
    </div>
  );
}

function UnavailableSlot({ type, reason }: { type: 'source' | 'recorded'; reason: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]"
      title={reason}
    >
      {type === 'source'
        ? <FileAudio className="w-3.5 h-3.5 opacity-40 shrink-0" />
        : <Mic2 className="w-3.5 h-3.5 opacity-30 shrink-0" />
      }
      <span className="truncate">{reason}</span>
    </div>
  );
}

export function FileDownloadPanel({
  sourceFile,
  recordedFile,
  userRole,
  userId,
  ownerId,
  layout = 'row',
  showMeta = false,
  className,
}: Props) {
  const hasSource = !!sourceFile;
  const hasRecorded = !!recordedFile;
  const sourceAccessible = canDownloadSource(userRole);
  const recordedAccessible = canDownloadRecorded(userRole, userId, ownerId);

  if (layout === 'row') {
    return (
      <div className={cn('space-y-1.5', className)}>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
          <Info className="w-3 h-3" />
          Ses Dosyaları
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {hasSource && sourceAccessible ? (
            <DownloadButton
              file={sourceFile}
              type="source"
              userRole={userRole}
              userId={userId}
              variant="compact"
            />
          ) : (
            <UnavailableSlot
              type="source"
              reason={!hasSource ? 'Kaynak ses yüklenmemiş' : 'Erişim yok'}
            />
          )}
          {hasRecorded && recordedAccessible ? (
            <DownloadButton
              file={recordedFile}
              type="recorded"
              userRole={userRole}
              userId={userId}
              ownerId={ownerId}
              variant="compact"
            />
          ) : (
            <UnavailableSlot
              type="recorded"
              reason={!hasRecorded ? 'Kayıt henüz yüklenmemiş' : 'Erişim yok'}
            />
          )}
        </div>
        {showMeta && (
          <div className="space-y-0.5 mt-1">
            {sourceFile && <FileMeta file={sourceFile} label="Kaynak" />}
            {recordedFile && <FileMeta file={recordedFile} label="Kayıt" />}
          </div>
        )}
      </div>
    );
  }

  // CARDS layout
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', className)}>

      {/* Kaynak Ses Kartı */}
      <div className={cn(
        'rounded-xl border p-3 space-y-2 transition-colors',
        hasSource
          ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)]'
          : 'border-[var(--border)] bg-[var(--bg-surface)]'
      )}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-elevated)] border border-[var(--border)]">
            <FileAudio className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">Orijinal Ses</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {hasSource ? 'PM/Dev tarafından yüklendi' : 'Henüz yüklenmedi'}
            </p>
          </div>
        </div>

        {sourceFile && (
          <div className="space-y-0.5">
            <p className="text-[11px] text-[var(--text-secondary)] font-mono truncate">{sourceFile.fileName}</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {formatFileSize(sourceFile.fileSize)}
              {sourceFile.duration && ` · ${formatDuration(sourceFile.duration)}`}
            </p>
          </div>
        )}

        <DownloadButton
          file={sourceFile}
          type="source"
          userRole={userRole}
          userId={userId}
          variant="full"
        />
      </div>

      {/* Kayıt Alınan Ses Kartı */}
      <div className={cn(
        'rounded-xl border p-3 space-y-2 transition-colors',
        hasRecorded
          ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)]'
          : 'border-[var(--border)] bg-[var(--bg-surface)]'
      )}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-elevated)] border border-[var(--border)]">
            <Mic2 className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-primary)]">Türkçe Kayıt</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {hasRecorded ? 'Sanatçı tarafından yüklendi' : 'Henüz yüklenmedi'}
            </p>
          </div>
        </div>

        {recordedFile && (
          <div className="space-y-0.5">
            <p className="text-[11px] text-[var(--text-secondary)] font-mono truncate">{recordedFile.fileName}</p>
            <p className="text-[10px] text-[var(--text-muted)]">
              {formatFileSize(recordedFile.fileSize)}
              {recordedFile.duration && ` · ${formatDuration(recordedFile.duration)}`}
            </p>
          </div>
        )}

        <DownloadButton
          file={recordedFile}
          type="recorded"
          userRole={userRole}
          userId={userId}
          ownerId={ownerId}
          variant="full"
        />
      </div>
    </div>
  );
}
