// ============================================================
// SOURCE DOWNLOAD BUTTON — Phase 8
// Kaynak ses dosyasının indirilmesi için buton bileşeni.
// Mock: progress simülasyonu + konsol log.
// Gerçek sistemde: presigned URL → <a download> veya fetch blob.
// ============================================================

import { useState } from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { mockDownloadSourceFile, formatFileSize } from '../../services/audioUploadService';
import type { AudioFile } from '../../types';
import { cn } from '../../utils/cn';

type DownloadState = 'idle' | 'downloading' | 'done' | 'error';

interface Props {
  file: AudioFile;
  /** Compact mod — sadece ikon göster */
  compact?: boolean;
  className?: string;
}

export function SourceDownloadButton({ file, compact = false, className }: Props) {
  const [state, setState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    if (state === 'downloading') return;
    setState('downloading');
    setProgress(0);

    try {
      await mockDownloadSourceFile(file, (pct) => setProgress(pct));
      setState('done');
      // 3 saniye sonra idle'a dön
      setTimeout(() => {
        setState('idle');
        setProgress(0);
      }, 3000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const isDownloading = state === 'downloading';
  const isDone = state === 'done';

  if (compact) {
    return (
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        title={`İndir: ${file.fileName} (${formatFileSize(file.fileSize)})`}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-md transition-all',
          isDone
            ? 'text-emerald-400 bg-emerald-500/10'
            : isDownloading
            ? 'text-indigo-400 bg-indigo-500/10 cursor-wait'
            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-700/60',
          className
        )}
      >
        {isDownloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
      </button>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full',
          isDone
            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            : isDownloading
            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 cursor-wait'
            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white'
        )}
      >
        {isDownloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : isDone ? (
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Download className="w-3.5 h-3.5 shrink-0" />
        )}

        <span className="truncate flex-1 text-left">
          {isDone ? 'İndirildi!' : isDownloading ? `İndiriliyor... ${progress}%` : 'Orijinali İndir'}
        </span>

        <span className="text-slate-500 shrink-0 text-[11px]">
          {formatFileSize(file.fileSize)}
        </span>
      </button>

      {/* Progress bar */}
      {isDownloading && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
