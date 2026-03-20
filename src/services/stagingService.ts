// ============================================================
// STAGING SERVICE — Phase 9
//
// Değişiklikler:
//   - Chunked commit: CHUNK_SIZE başına ayrı HF commit
//   - Her chunk bağımsız hata alabilir (diğerleri devam eder)
//   - CommitResult'a batchInfo eklendi
// ============================================================

import { uploadFiles } from '@huggingface/hub';
import {
  storageConfig,
  isStorageEnabled,
  buildAuthorizedUrl,
} from '../config/storage.config';
import { buildSourcePath, buildRecordedPath } from './hfPathService';
import type { AudioFile } from '../types';

// ─── Sabitler ────────────────────────────────────────────────

/** Tek HF commit'te gönderilecek max dosya sayısı */
export const CHUNK_SIZE = 50;

// ─── Tipler ──────────────────────────────────────────────────

export type StagedItemType = 'source' | 'recorded';

export type StagedItemStatus =
  | 'staged'       // Kuyruğa alındı, gönderilmedi
  | 'committing'   // Gönderiliyor
  | 'committed'    // Başarıyla gönderildi
  | 'error';       // Hata aldı

export interface StagedSourceItem {
  type: 'source';
  uid: string;
  file: File;
  fileName: string;
  fileSize: number;
  mimeType: string;
  projectId: string;
  projectTitle: string;
  characterId: string;
  taskId: string;
  uploadedBy: string;
  status: StagedItemStatus;
  errorMessage?: string;
  committedUrl?: string;
  committedAt?: string;
  audioFileId?: string;
}

export interface StagedRecordedItem {
  type: 'recorded';
  uid: string;
  file: File;
  fileName: string;
  fileSize: number;
  mimeType: string;
  projectId: string;
  projectTitle: string;
  characterId: string;
  taskId: string;
  lineId: string;
  versionNumber: number;
  uploadedBy: string;
  artistNote?: string;
  status: StagedItemStatus;
  errorMessage?: string;
  committedUrl?: string;
  committedAt?: string;
  audioFileId?: string;
}

export type StagedItem = StagedSourceItem | StagedRecordedItem;

// ─── Commit Sonucu ────────────────────────────────────────────

export interface BatchInfo {
  batchIndex: number;
  batchTotal: number;
  batchSize: number;
  success: boolean;
  error?: string;
}

export interface CommitResult {
  success: StagedItem[];
  failed: Array<{ item: StagedItem; error: string }>;
  totalCommits: number;
  batches: BatchInfo[];
}

// ─── Commit Seçenekleri ───────────────────────────────────────

export interface CommitOptions {
  /** Her item commit'lenince çağrılır (done, total) */
  onProgress?: (committed: number, total: number) => void;
  /** Item commit'lenince ProjectContext güncelleme için */
  onItemDone?: (item: StagedItem, audioFile: AudioFile) => void;
  /** Her batch tamamlanınca (başarı veya hata) */
  onBatchDone?: (batch: BatchInfo) => void;
}

// ─── UID Üretici ─────────────────────────────────────────────

export function genStagingId(): string {
  return `stg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── AudioFile Oluşturucu ─────────────────────────────────────

function makeAudioFile(
  item: StagedItem,
  url: string,
  committedAt: string
): AudioFile {
  const ext = item.fileName.split('.').pop() ?? '';
  return {
    id: `af_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    taskId: item.taskId,
    type: item.type === 'source' ? 'source' : 'recorded',
    fileName: item.fileName,
    fileSize: item.fileSize,
    mimeType: item.mimeType || `audio/${ext}`,
    url,
    uploadedBy: item.uploadedBy,
    uploadedAt: committedAt,
  };
}

// ─── Array Chunk Yardımcısı ───────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── HF Path Hesapla ─────────────────────────────────────────

function getHFPath(item: StagedItem): string {
  if (item.type === 'source') {
    return buildSourcePath({
      projectTitle: item.projectTitle,
      characterId: item.characterId,
      taskId: item.taskId,
      fileName: item.fileName,
    });
  }
  return buildRecordedPath({
    projectTitle: item.projectTitle,
    characterId: item.characterId,
    taskId: item.taskId,
    versionNumber: item.versionNumber,
    fileName: item.fileName,
  });
}

// ─── Mock commit (storage disabled) ──────────────────────────

async function mockCommitItems(
  items: StagedItem[],
  options: CommitOptions
): Promise<CommitResult> {
  const { onProgress, onItemDone, onBatchDone } = options;
  const now = new Date().toISOString();
  const chunks = chunkArray(items, CHUNK_SIZE);
  const success: StagedItem[] = [];
  let doneCount = 0;

  console.info(
    `[Staging MOCK] ${items.length} dosya, ${chunks.length} batch — VITE_HF_TOKEN ayarla.`
  );

  const batches: BatchInfo[] = [];

  for (let bi = 0; bi < chunks.length; bi++) {
    const chunk = chunks[bi];
    await new Promise((r) => setTimeout(r, 150 * chunk.length));

    for (const item of chunk) {
      const mockUrl = `mock://staged/${item.type}/${item.taskId}/${item.fileName}`;
      const audioFile = makeAudioFile(item, mockUrl, now);
      const committed: StagedItem = {
        ...item,
        status: 'committed',
        committedUrl: mockUrl,
        committedAt: now,
        audioFileId: audioFile.id,
      };
      success.push(committed);
      doneCount++;
      onProgress?.(doneCount, items.length);
      onItemDone?.(committed, audioFile);
    }

    const batchInfo: BatchInfo = {
      batchIndex: bi + 1,
      batchTotal: chunks.length,
      batchSize: chunk.length,
      success: true,
    };
    batches.push(batchInfo);
    onBatchDone?.(batchInfo);
  }

  return { success, failed: [], totalCommits: chunks.length, batches };
}

// ─── Ana Commit Fonksiyonu — Chunked ─────────────────────────

/**
 * Staged item listesini CHUNK_SIZE'lık batch'lere bölerek HF'ye gönderir.
 *
 * - Her batch için ayrı HF commit atılır
 * - Bir batch hata alırsa sadece o batch'teki item'lar failed'a düşer
 * - Diğer batch'ler çalışmaya devam eder
 * - onBatchDone callback'i her batch sonrası tetiklenir
 *
 * DISABLED modda mock simülasyon çalışır.
 */
export async function commitStagedItems(
  items: StagedItem[],
  options: CommitOptions = {}
): Promise<CommitResult> {
  const { onProgress, onItemDone, onBatchDone } = options;

  if (items.length === 0) {
    return { success: [], failed: [], totalCommits: 0, batches: [] };
  }

  // Mock mod
  if (!isStorageEnabled()) {
    return mockCommitItems(items, options);
  }

  // ── HF Mod — Chunked ─────────────────────────────────────
  const chunks = chunkArray(items, CHUNK_SIZE);
  const allSuccess: StagedItem[] = [];
  const allFailed: Array<{ item: StagedItem; error: string }> = [];
  const batches: BatchInfo[] = [];
  let doneCount = 0;
  const committedAt = new Date().toISOString();

  for (let bi = 0; bi < chunks.length; bi++) {
    const chunk = chunks[bi];

    // Path'leri hesapla
    const pathMap = new Map<string, string>();
    for (const item of chunk) {
      pathMap.set(item.uid, getHFPath(item));
    }

    const hfFiles = chunk.map((item) => ({
      path: pathMap.get(item.uid)!,
      content: item.file,
    }));

    const commitTitle =
      chunks.length === 1
        ? chunk.length === 1
          ? `VoiceTrack: ${chunk[0].type} — ${chunk[0].fileName}`
          : `VoiceTrack: batch upload (${chunk.length} files)`
        : `VoiceTrack: batch ${bi + 1}/${chunks.length} (${chunk.length} files)`;

    try {
      await uploadFiles({
        repo: {
          type: storageConfig.repoType,
          name: storageConfig.repoId,
        },
        accessToken: storageConfig.token,
        branch: storageConfig.branch,
        commitTitle,
        files: hfFiles,
      });

      // Batch başarılı
      for (const item of chunk) {
        const path = pathMap.get(item.uid)!;
        const url = buildAuthorizedUrl(path);
        const audioFile = makeAudioFile(item, url, committedAt);
        const committed: StagedItem = {
          ...item,
          status: 'committed',
          committedUrl: url,
          committedAt,
          audioFileId: audioFile.id,
        };
        allSuccess.push(committed);
        doneCount++;
        onProgress?.(doneCount, items.length);
        onItemDone?.(committed, audioFile);
      }

      const batchInfo: BatchInfo = {
        batchIndex: bi + 1,
        batchTotal: chunks.length,
        batchSize: chunk.length,
        success: true,
      };
      batches.push(batchInfo);
      onBatchDone?.(batchInfo);

    } catch (err) {
      // Bu batch hata aldı — diğerlerine devam
      const errorMsg = err instanceof Error ? err.message : String(err);

      for (const item of chunk) {
        allFailed.push({ item, error: errorMsg });
        doneCount++;
        onProgress?.(doneCount, items.length);
      }

      const batchInfo: BatchInfo = {
        batchIndex: bi + 1,
        batchTotal: chunks.length,
        batchSize: chunk.length,
        success: false,
        error: errorMsg,
      };
      batches.push(batchInfo);
      onBatchDone?.(batchInfo);
    }
  }

  return {
    success: allSuccess,
    failed: allFailed,
    totalCommits: chunks.length,
    batches,
  };
}
