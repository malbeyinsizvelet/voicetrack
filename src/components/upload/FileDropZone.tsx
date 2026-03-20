// ============================================================
// FILE DROP ZONE — Phase 7
// Sürükle-bırak + dosya seçici, çoklu dosya ve klasör desteği.
// Gerçek sistemde aynı bileşen S3 presigned upload ile çalışır.
// ============================================================

import { useRef, useState, useCallback } from 'react';
import { UploadCloud, FolderOpen, Music } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILES_PER_UPLOAD,
  extractAudioFiles,
  extractFilesFromDataTransfer,
} from '../../services/audioUploadService';

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function FileDropZone({ onFilesSelected, disabled = false, className }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragError, setIsDragError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // ── Drag Events ──────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    // Ses dosyası mı kontrol et
    const hasAudio = Array.from(e.dataTransfer.items).some((item) => {
      const ext = item.getAsFile()?.name ? `.${item.getAsFile()!.name.split('.').pop()!.toLowerCase()}` : '';
      return item.kind === 'file' && (item.type.startsWith('audio/') || ACCEPTED_EXTENSIONS.includes(ext));
    });

    setIsDragOver(true);
    setIsDragError(!hasAudio && e.dataTransfer.items.length > 0);
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // relatedTarget kontrolü: child element'lere geçişte kapanmasın
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
    setIsDragError(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsDragError(false);
    if (disabled) return;

    const files = await extractFilesFromDataTransfer(e.dataTransfer);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [disabled, onFilesSelected]);

  // ── Input Handlers ───────────────────────────────────────
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = extractAudioFiles(Array.from(e.target.files ?? []));
    if (files.length > 0) onFilesSelected(files);
    // Input'u sıfırla — aynı dosya tekrar seçilebilsin
    e.target.value = '';
  }, [onFilesSelected]);

  const handleFolderInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = extractAudioFiles(Array.from(e.target.files ?? []));
    if (files.length > 0) onFilesSelected(files);
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* ── Drop Area ────────────────────────────────────── */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-4',
          'border-2 border-dashed rounded-2xl p-10 transition-all duration-200 cursor-default select-none',
          disabled
            ? 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
            : isDragError
            ? 'border-red-500/60 bg-red-900/10'
            : isDragOver
            ? 'border-indigo-400/80 bg-indigo-900/20 scale-[1.01]'
            : 'border-slate-600/50 bg-slate-800/20 hover:border-slate-500/60 hover:bg-slate-800/30'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200',
            isDragError
              ? 'bg-red-900/40 text-red-400'
              : isDragOver
              ? 'bg-indigo-700/40 text-indigo-300 scale-110'
              : 'bg-slate-700/50 text-slate-400'
          )}
        >
          {isDragOver
            ? <Music className="w-8 h-8" />
            : <UploadCloud className="w-8 h-8" />
          }
        </div>

        {/* Text */}
        <div className="text-center">
          {isDragError ? (
            <>
              <p className="text-red-400 font-semibold text-sm">Desteklenmeyen dosya türü</p>
              <p className="text-slate-500 text-xs mt-1">
                Sadece ses dosyaları kabul edilir: {ACCEPTED_EXTENSIONS.join(', ')}
              </p>
            </>
          ) : isDragOver ? (
            <>
              <p className="text-indigo-300 font-semibold text-sm">Bırak ve yükle</p>
              <p className="text-slate-400 text-xs mt-1">Dosyalar sıraya eklenecek</p>
            </>
          ) : (
            <>
              <p className="text-slate-300 font-semibold text-sm">
                Dosyaları buraya sürükle & bırak
              </p>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                {ACCEPTED_EXTENSIONS.join(' · ')} · Maks. {MAX_FILES_PER_UPLOAD} dosya
              </p>
            </>
          )}
        </div>

        {/* Overlay for drag state */}
        {isDragOver && (
          <div className="absolute inset-0 rounded-2xl border-2 border-indigo-400/60 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* ── Action Buttons ───────────────────────────────── */}
      <div className="flex gap-3">
        {/* Dosya seç */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl',
            'border border-slate-600/60 bg-slate-800/50 text-slate-300 text-sm font-medium',
            'hover:bg-slate-700/60 hover:border-slate-500/70 hover:text-slate-200',
            'transition-all duration-150 active:scale-[0.98]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Music className="w-4 h-4 text-indigo-400" />
          Dosya Seç
        </button>

        {/* Klasör seç */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => folderInputRef.current?.click()}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl',
            'border border-slate-600/60 bg-slate-800/50 text-slate-300 text-sm font-medium',
            'hover:bg-slate-700/60 hover:border-slate-500/70 hover:text-slate-200',
            'transition-all duration-150 active:scale-[0.98]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <FolderOpen className="w-4 h-4 text-amber-400" />
          Klasör Seç
        </button>
      </div>

      {/* ── Hidden Inputs ────────────────────────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={handleFileInput}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error — webkitdirectory not in standard types
        webkitdirectory="true"
        multiple
        className="hidden"
        onChange={handleFolderInput}
      />
    </div>
  );
}
