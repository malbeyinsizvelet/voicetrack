// ============================================================
// DOWNLOAD SERVICE — Phase 4 (Hugging Face Storage)
//
// İki çalışma modu:
//   ENABLED  (VITE_HF_TOKEN + VITE_HF_REPO ayarlıysa):
//     → HF private repo'dan yetkili fetch + blob → browser download
//     → Veya HF URL public ise direkt <a download> tetiklenir
//
//   DISABLED:
//     → Mock URL → triggerBrowserDownload → console.info
//     → Gerçek dosya indirilmez
//
// İki dosya tipi: source (kaynak) ve recorded (kayıt alınan).
// Rol bazlı erişim kontrolü bu katmanda yapılır.
// ============================================================

import type { AudioFile, UserRole } from '../types';
import { isStorageEnabled } from '../config/storage.config';
import { downloadFromHF } from './hfStorageService';

// ─── Tipler ──────────────────────────────────────────────────

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
  /** Dosyanın sahibi (recorded için — artist kısıtlaması) */
  ownerId?: string;
  /** Progress callback — 0-100 */
  onProgress?: (pct: number) => void;
}

// ─── Rol bazlı erişim ─────────────────────────────────────────

const SOURCE_DOWNLOAD_ROLES: UserRole[] = [
  'admin', 'project_manager', 'qc_reviewer', 'voice_artist',
];

const RECORDED_DOWNLOAD_ROLES: UserRole[] = [
  'admin', 'project_manager', 'qc_reviewer',
  'voice_artist', // → yalnızca kendi kaydı
];

// ─── Browser Download Tetikleme ───────────────────────────────

/**
 * Direkt URL → <a download> tetikleme.
 *
 * Mock URL (mock://...) → browser engeller, console.info yazar.
 * Gerçek HTTPS URL → <a download> ile stream indirir.
 *   Public HF URL: token gerekmez, direkt çalışır.
 *   Private HF URL: CORS + auth gerekir → downloadFromHF() kullan.
 */
function triggerBrowserDownload(url: string, fileName: string): void {
  const isMock = url.startsWith('mock://') || url.startsWith('/mock/');

  if (isMock) {
    console.info(
      `[Mock Download] "${fileName}" — Storage aktif değil. VITE_HF_TOKEN ve VITE_HF_REPO ayarla.`
    );
    return;
  }

  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 150);
  } catch (err) {
    console.error('[Download] Trigger başarısız:', err);
  }
}

// ─── Progress Simülasyonu (mock mod) ──────────────────────────

async function simulateProgress(
  fileSizeBytes: number,
  onProgress: (pct: number) => void
): Promise<void> {
  const durationMs = Math.min(Math.max((fileSizeBytes / (1024 * 1024)) * 300, 400), 3000);
  const steps = 20;
  const stepMs = durationMs / steps;

  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, stepMs));
    const eased = i < 15
      ? (i / steps) * 1.1
      : 0.82 + ((i - 15) / 5) * 0.18;
    onProgress(Math.min(Math.round(eased * 100), 100));
  }
}

// ─── HF URL Analizi ───────────────────────────────────────────

/**
 * HF URL'den path'i çıkar.
 * Format: https://huggingface.co/datasets/{owner}/{repo}/resolve/{branch}/{path}
 * Döner: {path} kısmı
 */
function extractHFPath(url: string): string | null {
  try {
    const match = url.match(/\/resolve\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * URL'in gerçek HF URL'i olup olmadığını kontrol eder.
 */
function isRealHFUrl(url: string): boolean {
  return url.startsWith('https://huggingface.co/') && url.includes('/resolve/');
}

// ─── Core Download ────────────────────────────────────────────

/**
 * Tek dosyayı indir.
 *
 * ENABLED + HF URL → downloadFromHF() (Authorization header ile fetch + blob)
 * ENABLED + diğer HTTPS → triggerBrowserDownload() (direkt)
 * DISABLED / mock URL → simulateProgress() + console.info
 */
async function performDownload(
  file: AudioFile,
  onProgress: (pct: number) => void
): Promise<void> {
  const { url, fileName, fileSize } = file;

  // HF storage aktif ve URL gerçek HF URL'i
  if (isStorageEnabled() && isRealHFUrl(url)) {
    const hfPath = extractHFPath(url);
    if (hfPath) {
      // Private repo → yetkili fetch + blob download
      await downloadFromHF(hfPath, fileName, onProgress);
      return;
    }
    // Path çıkarılamadı → direkt trigger
    await simulateProgress(fileSize, onProgress);
    triggerBrowserDownload(url, fileName);
    return;
  }

  // Gerçek HTTPS ama HF değil (örn: S3 presigned URL)
  if (url.startsWith('https://') || url.startsWith('http://')) {
    await simulateProgress(fileSize, onProgress);
    triggerBrowserDownload(url, fileName);
    return;
  }

  // Mock URL — simüle et
  await simulateProgress(fileSize, onProgress);
  triggerBrowserDownload(url, fileName); // console.info yazar
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Kaynak ses indir.
 * Tüm yetkili roller erişebilir.
 */
export async function downloadSourceFile(opts: DownloadOptions): Promise<DownloadResult> {
  const { file, userRole, onProgress } = opts;

  if (!SOURCE_DOWNLOAD_ROLES.includes(userRole)) {
    return {
      success: false,
      fileName: file.fileName,
      fileSize: file.fileSize,
      error: 'Bu dosyayı indirme yetkiniz yok.',
    };
  }

  try {
    onProgress?.(0);
    await performDownload(file, onProgress ?? (() => {}));
    return { success: true, fileName: file.fileName, fileSize: file.fileSize };
  } catch (err) {
    return {
      success: false,
      fileName: file.fileName,
      fileSize: file.fileSize,
      error: err instanceof Error ? err.message : 'İndirme başarısız oldu.',
    };
  }
}

/**
 * Kayıt alınan sesi indir.
 * Artist yalnızca kendi kaydını indirebilir.
 */
export async function downloadRecordedFile(opts: DownloadOptions): Promise<DownloadResult> {
  const { file, userRole, userId, ownerId, onProgress } = opts;

  if (!RECORDED_DOWNLOAD_ROLES.includes(userRole)) {
    return {
      success: false,
      fileName: file.fileName,
      fileSize: file.fileSize,
      error: 'Bu dosyayı indirme yetkiniz yok.',
    };
  }

  if (userRole === 'voice_artist' && ownerId && ownerId !== userId) {
    return {
      success: false,
      fileName: file.fileName,
      fileSize: file.fileSize,
      error: 'Yalnızca kendi kayıtlarınızı indirebilirsiniz.',
    };
  }

  try {
    onProgress?.(0);
    await performDownload(file, onProgress ?? (() => {}));
    return { success: true, fileName: file.fileName, fileSize: file.fileSize };
  } catch (err) {
    return {
      success: false,
      fileName: file.fileName,
      fileSize: file.fileSize,
      error: err instanceof Error ? err.message : 'İndirme başarısız oldu.',
    };
  }
}

/**
 * Tip bazlı yönlendirici.
 */
export async function downloadFile(opts: DownloadOptions): Promise<DownloadResult> {
  return opts.type === 'source'
    ? downloadSourceFile(opts)
    : downloadRecordedFile(opts);
}

// ─── Erişim Kontrol Yardımcıları ─────────────────────────────

export function canDownloadSource(role: UserRole): boolean {
  return SOURCE_DOWNLOAD_ROLES.includes(role);
}

export function canDownloadRecorded(role: UserRole, userId: string, ownerId?: string): boolean {
  if (!RECORDED_DOWNLOAD_ROLES.includes(role)) return false;
  if (role === 'voice_artist') return ownerId === userId;
  return true;
}

export function getUnavailableReason(type: DownloadType, fileExists: boolean): string {
  if (!fileExists) {
    return type === 'source'
      ? 'Kaynak ses henüz yüklenmemiş'
      : 'Kayıt henüz yüklenmemiş';
  }
  return 'Erişim yetkiniz yok';
}
