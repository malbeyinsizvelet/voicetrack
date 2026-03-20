import type { UploadedFileEntry, UploadFileStatus, AudioFile } from '../types';
import { isStorageEnabled } from '../config/storage.config';

export const ACCEPTED_AUDIO_TYPES = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/flac', 'audio/aiff', 'audio/x-aiff'];
export const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aif', '.aiff'];
export const MAX_FILE_SIZE = 500 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 200;

export function getExtension(fileName: string): string { const parts = fileName.split('.'); return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : ''; }
export function getBaseName(fileName: string): string { const ext = getExtension(fileName); return ext ? fileName.slice(0, -ext.length) : fileName; }
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function estimateDuration(fileSize: number, ext: string): number | undefined {
  const kbps: Record<string, number> = { '.wav': 1411, '.flac': 800, '.mp3': 128, '.m4a': 128, '.ogg': 112, '.aif': 1411, '.aiff': 1411 };
  const rate = kbps[ext];
  if (!rate) return undefined;
  return Math.round((fileSize * 8) / (rate * 1000));
}

export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const ext = getExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_AUDIO_TYPES.includes(file.type)) return { valid: false, error: `Desteklenmeyen format: ${ext || file.type}` };
  if (file.size > MAX_FILE_SIZE) return { valid: false, error: `Dosya çok büyük: ${formatFileSize(file.size)}. Maksimum: ${formatFileSize(MAX_FILE_SIZE)}` };
  if (file.size === 0) return { valid: false, error: 'Boş dosya yüklenemez.' };
  return { valid: true };
}

export function buildUploadEntries(files: File[], existingFileNames: Set<string> = new Set()): UploadedFileEntry[] {
  return files.slice(0, MAX_FILES_PER_UPLOAD).map((file) => {
    const uid = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const ext = getExtension(file.name);
    const baseName = getBaseName(file.name);
    const previewUrl = URL.createObjectURL(file);
    const validation = validateAudioFile(file);
    const isDuplicate = existingFileNames.has(file.name.toLowerCase());
    let status: UploadFileStatus = 'queued';
    let errorMessage: string | undefined;
    if (!validation.valid) { status = 'error'; errorMessage = validation.error; }
    else if (isDuplicate) { status = 'duplicate'; errorMessage = 'Bu dosya adı zaten mevcut.'; }
    return { file, uid, baseName, fileName: file.name, fileSize: file.size, mimeType: file.type || `audio/${ext.slice(1)}`, previewUrl, estimatedDuration: estimateDuration(file.size, ext), status, progress: 0, errorMessage };
  });
}

export async function mockUploadOne(entry: UploadedFileEntry, onProgress: (pct: number) => void): Promise<AudioFile> {
  const ext = getExtension(entry.fileName);
  const uploadDuration = Math.min(400 + (entry.fileSize / (1024 * 1024)) * 200, 2000);
  const steps = 20;
  const stepDuration = uploadDuration / steps;
  for (let i = 1; i <= steps; i++) { await new Promise((r) => setTimeout(r, stepDuration)); const eased = i / steps; onProgress(Math.round(eased * 100)); }
  return { id: `af_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, taskId: '', type: 'source', fileName: entry.fileName, fileSize: entry.fileSize, mimeType: entry.mimeType, duration: entry.estimatedDuration, url: `mock://uploads/${entry.fileName}`, uploadedBy: '', uploadedAt: new Date().toISOString() };
}

export function extractAudioFiles(fileList: FileList | null): File[] {
  if (!fileList) return [];
  return Array.from(fileList).filter((f) => { const ext = getExtension(f.name); return ACCEPTED_EXTENSIONS.includes(ext); });
}

export async function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = [];
  const items = Array.from(dataTransfer.items);
  async function traverseEntry(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      await new Promise<void>((resolve) => { fileEntry.file((f) => { const ext = getExtension(f.name); if (ACCEPTED_EXTENSIONS.includes(ext)) files.push(f); resolve(); }); });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      await new Promise<void>((resolve) => { reader.readEntries(async (entries) => { for (const e of entries) await traverseEntry(e); resolve(); }); });
    }
  }
  const supportsEntryAPI = items.length > 0 && typeof items[0].webkitGetAsEntry === 'function';
  if (supportsEntryAPI) { for (const item of items) { const entry = item.webkitGetAsEntry(); if (entry) await traverseEntry(entry); } }
  else { return extractAudioFiles(dataTransfer.files); }
  return files;
}

export async function uploadRecordedFile(file: File, taskId: string, lineId: string, userId: string, onProgress: (pct: number) => void): Promise<AudioFile> {
  const ext = getExtension(file.name);
  const now = new Date().toISOString();
  const audioFileId = `af_rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (!isStorageEnabled()) {
    console.info('[Storage DISABLED] Kayıt ses mock\'landı:', file.name);
    const uploadDuration = Math.min(600 + (file.size / (1024 * 1024)) * 300, 3000);
    const steps = 25;
    const stepDuration = uploadDuration / steps;
    for (let i = 1; i <= steps; i++) { await new Promise((r) => setTimeout(r, stepDuration)); const eased = i / steps; onProgress(Math.round(eased * 100)); }
    return { id: audioFileId, taskId, type: 'recorded', fileName: file.name, fileSize: file.size, mimeType: file.type || `audio/${ext.slice(1)}`, duration: undefined, url: URL.createObjectURL(file), uploadedBy: userId, uploadedAt: now };
  }

  const uploadDuration = Math.min(600 + (file.size / (1024 * 1024)) * 300, 3000);
  const steps = 25;
  const stepDuration = uploadDuration / steps;
  for (let i = 1; i <= steps; i++) { await new Promise((r) => setTimeout(r, stepDuration)); onProgress(Math.round((i / steps) * 100)); }

  void lineId;
  return { id: audioFileId, taskId, type: 'recorded', fileName: file.name, fileSize: file.size, mimeType: file.type || `audio/${ext.slice(1)}`, url: URL.createObjectURL(file), uploadedBy: userId, uploadedAt: now };
}

export async function mockDownloadSourceFile(file: { fileName: string; url: string; fileSize: number }, onProgress?: (pct: number) => void): Promise<void> {
  const downloadDuration = Math.min(300 + (file.fileSize / (1024 * 1024)) * 150, 1500);
  const steps = 10;
  const stepDuration = downloadDuration / steps;
  for (let i = 1; i <= steps; i++) { await new Promise((r) => setTimeout(r, stepDuration)); onProgress?.(Math.round((i / steps) * 100)); }
  console.info(`[Mock Download] ${file.fileName}`);
}

export function revokeEntryUrls(entries: UploadedFileEntry[]): void {
  entries.forEach((e) => { try { URL.revokeObjectURL(e.previewUrl); } catch (_) { /* ignore */ } });
}
