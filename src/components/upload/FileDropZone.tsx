// ============================================================
// FILE DROP ZONE – Phase 7
// Sürükle-bırak + dosya seçici, çoklu dosya ve klasör desteği.
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

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

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

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = extractAudioFiles(Array.from(e.target.files ?? []));
    if (files.length > 0) onFilesSelected(files);
    e.target.value = '';
  }, [onFilesSelected]);

  const handleFolderInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = extractAudioFiles(Array.from(e.target.files ?? []));
    if (files.length > 0) onFilesSelected(files);
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
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
                Dosyaları buraya sürükle &amp; bırak
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {ACCEPTED_EXTENSIONS.join(', ')} · Maks {MAX_FILES_PER_UPLOAD} dosya
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-slate-700/60 hover:bg-slate-700 text-slate-300"
          >
            <Music className="w-3.5 h-3.5" />
            Dosya Seç
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-slate-700/60 hover:bg-slate-700 text-slate-300"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Klasör Seç
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-ignore
        webkitdirectory=""
        onChange={handleFolderInput}
        className="hidden"
      />
    </div>
  );
}
