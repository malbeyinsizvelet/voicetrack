// ============================================================
// AUDIO UPLOAD SERVICE — Phase 4 (Hugging Face Storage)
//
// İki çalışma modu:
//   ENABLED  (VITE_HF_TOKEN + VITE_HF_REPO ayarlıysa):
//     → Gerçek HF dataset repo'ya yükler
//     → Dönen URL HF CDN/resolve URL'i olur
//
//   DISABLED (env değerleri yoksa):
//     → Mock moda düşer (konsola bilgi yazar)
//     → Geliştirme ortamı için sorunsuz çalışır
//
// Storage katmanı: hfStorageService.ts
// Download katmanı: downloadService.ts
// Config: config/storage.config.ts
// ============================================================

import type { UploadedFileEntry, UploadFileStatus, AudioFile } from '../types';
import { isStorageEnabled } from '../config/storage.config';
import { uploadToHF, buildHFPath, sanitizeFileName } from './hfStorageService';

// ─── Desteklenen formatlar ────────────────────────────────────

export const ACCEPTED_AUDIO_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',       // .mp3
  'audio/mp4',        // .m4a
  'audio/ogg',
  'audio/flac',
  'audio/aiff',
  'audio/x-aiff',
];

export const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aif', '.aiff'];

/** Maksimum tek dosya boyutu (500 MB) */
export const MAX_FILE_SIZE = 500 * 1024 * 1024;

/** Tek seferde yüklenebilecek maksimum dosya sayısı */
export const MAX_FILES_PER_UPLOAD = 200;

// ─── Yardımcılar ─────────────────────────────────────────────

export function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

export function getBaseName(fileName: string): string {
  const ext = getExtension(fileName);
  return ext ? fileName.slice(0, -ext.length) : fileName;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Tahmini ses süresi (saniye).
 * Gerçek sistemde: Web Audio API ile AudioContext.decodeAudioData()
 * Şimdi: dosya boyutuna göre kaba tahmin
 */
function estimateDuration(fileSize: number, ext: string): number {
  const bytesPerSecond = ['.wav', '.aif', '.aiff'].includes(ext)
    ? (44100 * 2 * 2)     // 44.1kHz, 16bit, stereo ≈ ~10MB/min
    : (128 * 1024) / 8;   // 128kbps mp3 ≈ ~1MB/min
  return Math.round(fileSize / bytesPerSecond);
}

// ─── Dosya Doğrulama ─────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAudioFile(file: File): ValidationResult {
  const ext = getExtension(file.name);

  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Desteklenmeyen format: ${ext || 'uzantısız'}. Kabul edilenler: ${ACCEPTED_EXTENSIONS.join(', ')}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Dosya çok büyük: ${formatFileSize(file.size)}. Maksimum: ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Boş dosya yüklenemez.' };
  }

  return { valid: true };
}

// ─── Entry Oluşturma ─────────────────────────────────────────

/**
 * File[] → UploadedFileEntry[] dönüşümü.
 * Gerçek File metadata'sı (name, size, type) kullanılır.
 */
export function buildUploadEntries(
  files: File[],
  existingFileNames: Set<string> = new Set()
): UploadedFileEntry[] {
  return files.slice(0, MAX_FILES_PER_UPLOAD).map((file) => {
    const uid = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const ext = getExtension(file.name);
    const baseName = getBaseName(file.name);
    const previewUrl = URL.createObjectURL(file);
    const validation = validateAudioFile(file);
    const isDuplicate = existingFileNames.has(file.name.toLowerCase());

    let status: UploadFileStatus = 'queued';
    let errorMessage: string | undefined;

    if (!validation.valid) {
      status = 'error';
      errorMessage = validation.error;
    } else if (isDuplicate) {
      status = 'duplicate';
      errorMessage = 'Bu dosya adı zaten mevcut.';
    }

    return {
      file,                                          // Gerçek File nesnesi korunur
      uid,
      baseName,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || `audio/${ext.slice(1)}`, // Gerçek MIME type
      previewUrl,
      estimatedDuration: estimateDuration(file.size, ext),
      status,
      progress: 0,
      errorMessage,
    };
  });
}

// ─── Upload Pipeline ─────────────────────────────────────────

/**
 * Kaynak ses dosyasını yükler (PM/Admin tarafından).
 *
 * ENABLED modu → Hugging Face dataset repo'ya yükler.
 *   Path: {projectId}/{characterId}/{taskId}/source/{fileName}
 *   Dönen URL: HF resolve URL (Authorization header ile erişilir)
 *
 * DISABLED modu → Mock davranış, konsola bilgi yazar.
 */
export async function uploadSourceFile(
  entry: UploadedFileEntry,
  taskId: string,
  userId: string,
  onProgress: (pct: number) => void,
  /** HF path için gerekli — storage enabled ise kullanılır */
  pathContext?: { projectId: string; characterId: string }
): Promise<AudioFile> {
  const now = new Date().toISOString();
  const audioFileId = `af_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (isStorageEnabled() && pathContext) {
    // ── Gerçek HF Upload ──────────────────────────────────────
    const hfPath = buildHFPath({
      projectId: pathContext.projectId,
      characterId: pathContext.characterId,
      taskId,
      type: 'source',
      version: 1,
      fileName: sanitizeFileName(entry.fileName),
    });

    const result = await uploadToHF({
      file: entry.file,
      path: hfPath,
      commitMessage: `VoiceTrack: source upload — task ${taskId}`,
      onProgress,
    });

    return {
      id: audioFileId,
      taskId,
      type: 'source',
      fileName: entry.fileName,
      fileSize: entry.fileSize,
      mimeType: entry.mimeType,
      duration: entry.estimatedDuration,
      url: result.url,       // Gerçek HF URL
      uploadedBy: userId,
      uploadedAt: result.uploadedAt,
    };
  }

  // ── Mock Modu ────────────────────────────────────────────────
  console.info(
    '[Storage DISABLED] Kaynak ses mock\'landı:',
    entry.fileName,
    '— Gerçek upload için VITE_HF_TOKEN ve VITE_HF_REPO ayarla.'
  );

  const uploadDuration = Math.min(400 + (entry.fileSize / (1024 * 1024)) * 200, 2000);
  const steps = 20;
  const stepDuration = uploadDuration / steps;

  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, stepDuration));
    const rawProgress = i / steps;
    const eased = rawProgress < 0.8 ? rawProgress * 1.1 : 0.88 + (rawProgress - 0.8) * 0.6;
    onProgress(Math.min(Math.round(eased * 100), 95));
  }
  onProgress(100);

  return {
    id: audioFileId,
    taskId,
    type: 'source',
    fileName: entry.fileName,
    fileSize: entry.fileSize,
    mimeType: entry.mimeType,
    duration: entry.estimatedDuration,
    url: `mock://storage/tasks/${taskId}/source/${entry.fileName}`,
    uploadedBy: userId,
    uploadedAt: now,
  };
}

/**
 * Geriye uyumluluk için — BulkUploadModal ve eski çağrılar için.
 * pathContext olmadan mock moda düşer.
 */
export async function mockUploadOne(
  entry: UploadedFileEntry,
  taskId: string,
  userId: string,
  onProgress: (pct: number) => void
): Promise<AudioFile> {
  return uploadSourceFile(entry, taskId, userId, onProgress);
}

/**
 * Sanatçının kayıt dosyasını yükler.
 * Gerçek File nesnesi işlenir — metadata eksiksiz taşınır.
 *
 * ENABLED modu → Hugging Face dataset repo'ya yükler.
 *   Path: {projectId}/{characterId}/{taskId}/recorded/v{n}/{fileName}
 *
 * DISABLED modu → Mock davranış.
 */
export async function uploadRecordedFile(
  file: File,
  taskId: string,
  lineId: string,
  userId: string,
  onProgress: (pct: number) => void,
  /** HF path için gerekli — storage enabled ise kullanılır */
  pathContext?: {
    projectId: string;
    characterId: string;
    versionNumber: number;
  }
): Promise<AudioFile> {
  const ext = getExtension(file.name);
  const now = new Date().toISOString();
  const audioFileId = `af_rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (isStorageEnabled() && pathContext) {
    // ── Gerçek HF Upload ──────────────────────────────────────
    const hfPath = buildHFPath({
      projectId: pathContext.projectId,
      characterId: pathContext.characterId,
      taskId,
      type: 'recorded',
      version: pathContext.versionNumber,
      fileName: sanitizeFileName(file.name),
    });

    const result = await uploadToHF({
      file,
      path: hfPath,
      commitMessage: `VoiceTrack: recorded upload — line ${lineId} v${pathContext.versionNumber}`,
      onProgress,
    });

    return {
      id: audioFileId,
      taskId,
      type: 'recorded',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || `audio/${ext.slice(1)}`,
      duration: estimateDuration(file.size, ext),
      url: result.url,       // Gerçek HF URL
      uploadedBy: userId,
      uploadedAt: result.uploadedAt,
    };
  }

  // ── Mock Modu ────────────────────────────────────────────────
  console.info(
    '[Storage DISABLED] Kayıt ses mock\'landı:',
    file.name,
    '— Gerçek upload için VITE_HF_TOKEN ve VITE_HF_REPO ayarla.'
  );

  const uploadDuration = Math.min(600 + (file.size / (1024 * 1024)) * 300, 3000);
  const steps = 25;
  const stepDuration = uploadDuration / steps;

  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, stepDuration));
    const rawProgress = i / steps;
    const eased = rawProgress < 0.7 ? rawProgress * 1.15 : 0.8 + (rawProgress - 0.7) * 0.6;
    onProgress(Math.min(Math.round(eased * 100), 96));
  }
  onProgress(100);

  return {
    id: audioFileId,
    taskId,
    type: 'recorded',
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || `audio/${ext.slice(1)}`,
    duration: estimateDuration(file.size, ext),
    url: `mock://storage/tasks/${taskId}/recorded/${lineId}_v${Date.now()}${ext}`,
    uploadedBy: userId,
    uploadedAt: now,
  };
}

// ─── Dosya Seçim Yardımcıları ─────────────────────────────────

export function extractAudioFiles(fileList: FileList | File[]): File[] {
  return Array.from(fileList).filter((f) => {
    const ext = getExtension(f.name);
    return ACCEPTED_EXTENSIONS.includes(ext);
  });
}

/**
 * Klasör yükleme — DataTransferItemList'ten recursive dosya çekme.
 * Chrome/Edge: FileSystem API; Safari/Firefox: normal FileList fallback.
 */
export async function extractFilesFromDataTransfer(
  dataTransfer: DataTransfer
): Promise<File[]> {
  const files: File[] = [];
  const items = Array.from(dataTransfer.items);

  async function traverseEntry(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      await new Promise<void>((resolve) => {
        fileEntry.file((f) => {
          const ext = getExtension(f.name);
          if (ACCEPTED_EXTENSIONS.includes(ext)) files.push(f);
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const reader = dirEntry.createReader();
      await new Promise<void>((resolve) => {
        reader.readEntries(async (entries) => {
          for (const e of entries) await traverseEntry(e);
          resolve();
        });
      });
    }
  }

  const supportsEntryAPI = items.length > 0 && typeof items[0].webkitGetAsEntry === 'function';
  if (supportsEntryAPI) {
    for (const item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry) await traverseEntry(entry);
    }
  } else {
    return extractAudioFiles(dataTransfer.files);
  }

  return files;
}

/** Object URL'lerini temizle (memory leak önleme) */
export function revokeEntryUrls(entries: UploadedFileEntry[]): void {
  entries.forEach((e) => {
    try { URL.revokeObjectURL(e.previewUrl); } catch (_) { /* ignore */ }
  });
}

/**
 * Mock download simülasyonu — storage disabled modda kullanılır.
 * HF enabled modda downloadService.ts doğrudan HF URL kullanır.
 */
export async function mockDownloadSourceFile(
  file: { fileName: string; url: string; fileSize: number },
  onProgress?: (pct: number) => void
): Promise<void> {
  const downloadDuration = Math.min(300 + (file.fileSize / (1024 * 1024)) * 150, 1500);
  const steps = 10;
  const stepDuration = downloadDuration / steps;

  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, stepDuration));
    onProgress?.(Math.round((i / steps) * 100));
  }

  console.info(
    `[Mock Download] ${file.fileName} (${formatFileSize(file.fileSize)})`,
    '— HF storage enabled olduğunda gerçek indirme çalışır.'
  );
}
