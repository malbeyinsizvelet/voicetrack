// ============================================================
// STAGING SERVICE — HF commit + Supabase metadata sync
//
// Dosya akışı:
//   1. Dosyalar staged queue'ya eklenir (geçici, localStorage)
//   2. commitAll() → HF'ye toplu upload
//   3. HF başarılıysa → Supabase'e audio_files + recording_versions metadata
//   4. Hata durumunda Supabase yazımı atlanır ama HF commit sonucu korunur
// ============================================================

import { uploadFiles } from '@huggingface/hub';
import { storageConfig, isStorageEnabled, buildAuthorizedUrl } from '../config/storage.config';
import { buildSourcePath, buildRecordedPath } from './hfPathService';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { createLogger } from '../lib/logger';
import type { AudioFile } from '../types';

const log = createLogger('StagingService');

export const CHUNK_SIZE = 50;

export type StagedItemType = 'source' | 'recorded';
export type StagedItemStatus = 'staged' | 'committing' | 'committed' | 'error';

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

export interface CommitOptions {
  onProgress?: (committed: number, total: number) => void;
  onItemDone?: (item: StagedItem, audioFile: AudioFile) => void;
  onBatchDone?: (batch: BatchInfo) => void;
}

export function genStagingId(): string {
  return `stg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeAudioFile(item: StagedItem, url: string, committedAt: string): AudioFile {
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

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

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

// ─── Supabase metadata yazımı (HF commit sonrası) ────────────
async function persistAudioFileToSupabase(
  item: StagedItem,
  hfPath: string,
  hfUrl: string,
  committedAt: string
): Promise<string | null> {
  if (!isSupabaseEnabled()) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const audioInsert: Record<string, unknown> = {
      task_id: item.taskId,
      type: item.type === 'source' ? 'source' : 'recorded',
      file_name: item.fileName,
      file_size: item.fileSize,
      mime_type: item.mimeType || null,
      hf_path: hfPath,
      hf_url: hfUrl,
      storage_provider: 'huggingface',
      uploaded_by: item.uploadedBy,
      uploaded_at: committedAt,
    };

    if (item.type === 'recorded') {
      audioInsert.line_id = item.lineId;
      audioInsert.version_number = item.versionNumber;
    }

    const { data: audioFile, error: audioError } = await db
      .from('audio_files')
      .insert(audioInsert)
      .select('id')
      .single();

    if (audioError) {
      log.warn('audio_files insert failed', { error: audioError.message });
      return null;
    }

    // Recorded için recording_versions kaydı da oluştur
    if (item.type === 'recorded') {
      const { error: versionError } = await db.from('recording_versions').insert({
        line_id: item.lineId,
        version: item.versionNumber,
        audio_file_id: audioFile.id,
        uploaded_at: committedAt,
        uploaded_by: item.uploadedBy,
        qc_status: 'pending',
      });

      if (versionError) {
        log.warn('recording_versions insert failed', { error: versionError.message });
      }
    }

    log.info('Supabase audio metadata saved', { id: audioFile.id, type: item.type });
    return audioFile.id as string;
  } catch (err) {
    log.warn('persistAudioFileToSupabase failed', { err });
    return null;
  }
}

// ─── Mock commit (HF kapalıyken) ──────────────────────────────
async function mockCommitItems(items: StagedItem[], options: CommitOptions): Promise<CommitResult> {
  const { onProgress, onItemDone, onBatchDone } = options;
  const committedAt = new Date().toISOString();
  const chunks = chunkArray(items, CHUNK_SIZE);
  const success: StagedItem[] = [];
  let doneCount = 0;
  const batches: BatchInfo[] = [];

  log.info(`[Staging MOCK] ${items.length} dosya, ${chunks.length} batch`);

  for (let bi = 0; bi < chunks.length; bi++) {
    const chunk = chunks[bi];
    await new Promise((r) => setTimeout(r, 150 * chunk.length));

    for (const item of chunk) {
      const mockPath = getHFPath(item);
      const mockUrl = `mock://staged/${mockPath}`;
      const audioFile = makeAudioFile(item, mockUrl, committedAt);
      const committed: StagedItem = {
        ...item,
        status: 'committed',
        committedUrl: mockUrl,
        committedAt,
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

// ─── Gerçek HF commit ─────────────────────────────────────────
export async function commitStagedItems(
  items: StagedItem[],
  options: CommitOptions = {}
): Promise<CommitResult> {
  const { onProgress, onItemDone, onBatchDone } = options;

  if (items.length === 0) return { success: [], failed: [], totalCommits: 0, batches: [] };
  if (!isStorageEnabled()) return mockCommitItems(items, options);

  const chunks = chunkArray(items, CHUNK_SIZE);
  const allSuccess: StagedItem[] = [];
  const allFailed: Array<{ item: StagedItem; error: string }> = [];
  const batches: BatchInfo[] = [];
  let doneCount = 0;
  const committedAt = new Date().toISOString();

  for (let bi = 0; bi < chunks.length; bi++) {
    const chunk = chunks[bi];
    const pathMap = new Map<string, string>();
    for (const item of chunk) pathMap.set(item.uid, getHFPath(item));

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
      // ── 1. HF'ye yükle ──
      await uploadFiles({
        repo: { type: storageConfig.repoType, name: storageConfig.repoId },
        accessToken: storageConfig.token,
        branch: storageConfig.branch,
        commitTitle,
        files: hfFiles,
      });

      // ── 2. HF başarılı → Supabase metadata ──
      for (const item of chunk) {
        const hfPath = pathMap.get(item.uid)!;
        const url = buildAuthorizedUrl(hfPath);
        const audioFile = makeAudioFile(item, url, committedAt);

        // Supabase'e paralel yaz (başarısız olsa bile commit kabul edilir)
        const supabaseId = await persistAudioFileToSupabase(item, hfPath, url, committedAt);
        if (supabaseId) audioFile.id = supabaseId;

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
      const errorMsg = err instanceof Error ? err.message : String(err);
      log.warn(`Batch ${bi + 1} failed`, { errorMsg });

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

  return { success: allSuccess, failed: allFailed, totalCommits: chunks.length, batches };
}
