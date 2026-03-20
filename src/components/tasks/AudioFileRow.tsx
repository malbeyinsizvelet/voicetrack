import { FileAudio, Download, Play, Upload as UploadIcon } from 'lucide-react';
import type { AudioFile, AudioFileType } from '../../types';
import { formatFileSize, formatDuration } from '../../utils/formatters';

const FILE_TYPE_CONFIG: Record<AudioFileType, { label: string; icon: React.ReactNode }> = {
  source:   { label: 'Kaynak',  icon: <FileAudio className="w-3 h-3" /> },
  recorded: { label: 'Kayıt',   icon: <UploadIcon className="w-3 h-3" /> },
  mixed:    { label: 'Mix',     icon: <FileAudio className="w-3 h-3" /> },
  final:    { label: 'Final',   icon: <FileAudio className="w-3 h-3" /> },
};

interface Props {
  file: AudioFile;
  typeOverride?: AudioFileType;
  disableActions?: boolean;
  compact?: boolean;
}

export function AudioFileRow({ file, typeOverride, disableActions = false, compact = false }: Props) {
  const type = typeOverride ?? file.type;
  const config = FILE_TYPE_CONFIG[type];

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.url ?? `mock://audio/${file.id}.wav`;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] group">
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-surface)]">
          {config.icon}
          {config.label}
        </span>
        <span className="text-[var(--text-secondary)] text-xs truncate flex-1 min-w-0">{file.fileName}</span>
        {file.duration && (
          <span className="text-[var(--text-muted)] text-[10px] shrink-0">
            {formatDuration(file.duration)}
          </span>
        )}
        <span className="text-[var(--text-muted)] text-[10px] shrink-0">
          {formatFileSize(file.fileSize)}
        </span>
        {!disableActions && (
          <button
            onClick={handleDownload}
            title="İndir"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] group hover:border-[var(--border-strong)] transition-colors">
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-surface)] shrink-0">
        {config.icon}
        {config.label}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[var(--text-secondary)] text-sm truncate">{file.fileName}</p>
        <p className="text-[var(--text-muted)] text-xs mt-0.5">
          {formatFileSize(file.fileSize)}
          {file.duration && ` · ${formatDuration(file.duration)}`}
        </p>
      </div>

      {!disableActions && (
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            title="Oynat (yakında)"
            disabled
            className="p-1.5 rounded-lg text-[var(--text-muted)] cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            title="İndir"
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
