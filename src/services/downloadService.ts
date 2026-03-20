import type { AudioFile, UserRole } from '../types';
import { isStorageEnabled } from '../config/storage.config';

export type DownloadType = 'source' | 'recorded';
export type DownloadState = 'idle' | 'preparing' | 'downloading' | 'done' | 'error' | 'unavailable';

export interface DownloadResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  error?: string;
}

export interface DownloadOptions {
  file: AudioFile;
  type: DownloadType;
  userRole: UserRole;
  userId: string;
  ownerId?: string;
  onProgress?: (pct: number) => void;
}

const SOURCE_DOWNLOAD_ROLES: UserRole[] = ['admin', 'project_manager', 'qc_reviewer', 'voice_artist'];
const RECORDED_DOWNLOAD_ROLES: UserRole[] = ['admin', 'project_manager', 'qc_reviewer', 'voice_artist'];

function triggerBrowserDownload(url: string, fileName: string): void {
  const isMock = url.startsWith('mock://') || url.startsWith('/mock/');
  if (isMock) { console.info(`[Mock Download] "${fileName}" — Storage aktif değil.`); return; }
  try {
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.rel = 'noopener noreferrer'; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => document.body.removeChild(a), 150);
  } catch (err) { console.error('[Download] Trigger başarısız:', err); }
}

async function simulateProgress(fileSizeBytes: number, onProgress: (pct: number) => void): Promise<void> {
  const durationMs = Math.min(Math.max((fileSizeBytes / (1024 * 1024)) * 300, 400), 3000);
  const steps = 20;
  const stepMs = durationMs / steps;
  for (let i = 1; i <= steps; i++) { await new Promise((r) => setTimeout(r, stepMs)); const eased = i / steps; onProgress(Math.round(eased * 100)); }
}

async function performDownload(file: AudioFile, onProgress: (pct: number) => void): Promise<void> {
  const { url, fileName, fileSize } = file;
  if (isStorageEnabled() && (url.startsWith('https://huggingface.co') || url.startsWith('https://hf.co'))) {
    await simulateProgress(fileSize, onProgress);
    triggerBrowserDownload(url, fileName);
    return;
  }
  await simulateProgress(fileSize, onProgress);
  triggerBrowserDownload(url, fileName);
}

export async function downloadSourceFile(opts: DownloadOptions): Promise<DownloadResult> {
  const { file, userRole, onProgress } = opts;
  if (!SOURCE_DOWNLOAD_ROLES.includes(userRole)) return { success: false, fileName: file.fileName, fileSize: file.fileSize, error: 'Bu dosyayı indirme yetkiniz yok.' };
  try { onProgress?.(0); await performDownload(file, onProgress ?? (() => {})); return { success: true, fileName: file.fileName, fileSize: file.fileSize }; }
  catch (err) { return { success: false, fileName: file.fileName, fileSize: file.fileSize, error: err instanceof Error ? err.message : 'İndirme başarısız oldu.' }; }
}

export async function downloadRecordedFile(opts: DownloadOptions): Promise<DownloadResult> {
  const { file, userRole, userId, ownerId, onProgress } = opts;
  if (!RECORDED_DOWNLOAD_ROLES.includes(userRole)) return { success: false, fileName: file.fileName, fileSize: file.fileSize, error: 'Bu dosyayı indirme yetkiniz yok.' };
  if (userRole === 'voice_artist' && ownerId && ownerId !== userId) return { success: false, fileName: file.fileName, fileSize: file.fileSize, error: 'Yalnızca kendi kayıtlarınızı indirebilirsiniz.' };
  try { onProgress?.(0); await performDownload(file, onProgress ?? (() => {})); return { success: true, fileName: file.fileName, fileSize: file.fileSize }; }
  catch (err) { return { success: false, fileName: file.fileName, fileSize: file.fileSize, error: err instanceof Error ? err.message : 'İndirme başarısız oldu.' }; }
}

export async function downloadFile(opts: DownloadOptions): Promise<DownloadResult> {
  return opts.type === 'source' ? downloadSourceFile(opts) : downloadRecordedFile(opts);
}

export function canDownloadSource(role: UserRole): boolean { return SOURCE_DOWNLOAD_ROLES.includes(role); }
export function canDownloadRecorded(role: UserRole, userId: string, ownerId?: string): boolean {
  if (!RECORDED_DOWNLOAD_ROLES.includes(role)) return false;
  if (role === 'voice_artist') return ownerId === userId;
  return true;
}
export function getUnavailableReason(type: DownloadType, fileExists: boolean): string {
  if (!fileExists) return type === 'source' ? 'Kaynak ses henüz yüklenmemiş' : 'Kayıt henüz yüklenmemiş';
  return 'Erişim yetkiniz yok';
}
