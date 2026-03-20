// ============================================================
// STAGING CONTEXT — Phase 9
//
// Değişiklikler:
//   - localStorage persist: staged + error item'lar korunur
//   - App açılışında queue geri yüklenir (File nesnesi hariç)
//   - committed item'lar persist edilmez
//   - batchInfo state eklendi (Batch 2/4 progress)
//   - userId bazlı storage key
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  genStagingId,
  commitStagedItems,
  type StagedItem,
  type StagedSourceItem,
  type StagedRecordedItem,
  type CommitResult,
  type BatchInfo,
} from '../services/stagingService';
import type { AudioFile } from '../types';

// ─── Persist ─────────────────────────────────────────────────

/** File nesnesi serialize edilemez — persist'te sadece metadata tutulur */
type PersistedItem = Omit<StagedItem, 'file'> & { fileRestored?: false };

function persistKey(userId: string): string {
  return `vt_staging_${userId}`;
}

function loadPersistedQueue(userId: string): PersistedItem[] {
  try {
    const raw = localStorage.getItem(persistKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedItem[];
    // Sadece staged ve error item'ları geri yükle
    return parsed.filter((i) => i.status === 'staged' || i.status === 'error');
  } catch {
    return [];
  }
}

function saveQueue(userId: string, queue: StagedItem[]): void {
  try {
    const toSave: PersistedItem[] = queue
      .filter((i) => i.status === 'staged' || i.status === 'error')
      .map(({ file: _file, ...rest }) => rest as PersistedItem);
    localStorage.setItem(persistKey(userId), JSON.stringify(toSave));
  } catch {
    // localStorage dolu olabilir — sessizce geç
  }
}

function clearPersisted(userId: string): void {
  localStorage.removeItem(persistKey(userId));
}

// ─── Callback Tipleri ─────────────────────────────────────────

export type OnSourceCommitted = (
  item: StagedSourceItem,
  audioFile: AudioFile
) => void;

export type OnRecordedCommitted = (
  item: StagedRecordedItem,
  audioFile: AudioFile
) => void;

// ─── Context Interface ────────────────────────────────────────

interface StagingContextValue {
  queue: StagedItem[];
  pendingCount: number;
  isCommitting: boolean;
  commitProgress: { done: number; total: number };
  batchProgress: { current: number; total: number } | null;

  stageSource: (
    file: File,
    meta: {
      projectId: string;
      projectTitle: string;
      characterId: string;
      taskId: string;
      uploadedBy: string;
    },
    onCommitted?: OnSourceCommitted
  ) => string;

  stageRecorded: (
    file: File,
    meta: {
      projectId: string;
      projectTitle: string;
      characterId: string;
      taskId: string;
      lineId: string;
      versionNumber: number;
      uploadedBy: string;
      artistNote?: string;
    },
    onCommitted?: OnRecordedCommitted
  ) => string;

  unstage: (uid: string) => void;
  commitAll: () => Promise<CommitResult>;
  clearErrors: () => void;
  clearCommitted: () => void;

  /** Belirli bir lineId için staged item var mı */
  getStagedUidForLine: (lineId: string) => string | null;
}

// ─── Context ──────────────────────────────────────────────────

const StagingContext = createContext<StagingContextValue | null>(null);

export function useStaging(): StagingContextValue {
  const ctx = useContext(StagingContext);
  if (!ctx) throw new Error('useStaging must be inside StagingProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────

export function StagingProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  // Persist'ten başlangıç queue'yu yükle
  // Not: File nesnesi olmayan item'lar "file-less" olarak gelir —
  //      bunlar sadece görsel olarak gösterilir, commit edilemez.
  const [queue, setQueue] = useState<StagedItem[]>(() => {
    const persisted = loadPersistedQueue(userId);
    // File nesnesi olmayan item'ları "error" olarak işaretle
    return persisted.map((item) => ({
      ...item,
      file: null as unknown as File,
      status: 'error' as const,
      errorMessage: 'Sayfa yenilendi — dosyayı tekrar seçin',
    })) as StagedItem[];
  });

  const [isCommitting, setIsCommitting] = useState(false);
  const [commitProgress, setCommitProgress] = useState({ done: 0, total: 0 });
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const callbacksRef = useRef<
    Map<string, OnSourceCommitted | OnRecordedCommitted>
  >(new Map());

  // Queue değişince persist et
  useEffect(() => {
    saveQueue(userId, queue);
  }, [queue, userId]);

  // Kullanıcı değişince eski queue'yu temizle, yeni yükle
  useEffect(() => {
    const persisted = loadPersistedQueue(userId);
    setQueue(
      persisted.map((item) => ({
        ...item,
        file: null as unknown as File,
        status: 'error' as const,
        errorMessage: 'Sayfa yenilendi — dosyayı tekrar seçin',
      })) as StagedItem[]
    );
    callbacksRef.current.clear();
  }, [userId]);

  // ── Source ekle ──────────────────────────────────────────────
  const stageSource = useCallback(
    (
      file: File,
      meta: {
        projectId: string;
        projectTitle: string;
        characterId: string;
        taskId: string;
        uploadedBy: string;
      },
      onCommitted?: OnSourceCommitted
    ): string => {
      const uid = genStagingId();
      const ext = file.name.split('.').pop() ?? '';
      const item: StagedSourceItem = {
        type: 'source',
        uid,
        file,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || `audio/${ext}`,
        ...meta,
        status: 'staged',
      };
      setQueue((prev) => [...prev, item]);
      if (onCommitted) callbacksRef.current.set(uid, onCommitted);
      return uid;
    },
    []
  );

  // ── Recorded ekle ────────────────────────────────────────────
  const stageRecorded = useCallback(
    (
      file: File,
      meta: {
        projectId: string;
        projectTitle: string;
        characterId: string;
        taskId: string;
        lineId: string;
        versionNumber: number;
        uploadedBy: string;
        artistNote?: string;
      },
      onCommitted?: OnRecordedCommitted
    ): string => {
      const uid = genStagingId();
      const ext = file.name.split('.').pop() ?? '';
      const item: StagedRecordedItem = {
        type: 'recorded',
        uid,
        file,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || `audio/${ext}`,
        ...meta,
        status: 'staged',
      };
      setQueue((prev) => [...prev, item]);
      if (onCommitted) callbacksRef.current.set(uid, onCommitted);
      return uid;
    },
    []
  );

  // ── Queue'dan çıkar ──────────────────────────────────────────
  const unstage = useCallback((uid: string) => {
    setQueue((prev) => prev.filter((i) => i.uid !== uid));
    callbacksRef.current.delete(uid);
  }, []);

  // ── Commit All — Chunked ─────────────────────────────────────
  const commitAll = useCallback(async (): Promise<CommitResult> => {
    // Sadece gerçek File nesnesi olan staged item'ları commit et
    const staged = queue.filter(
      (i) =>
        (i.status === 'staged' || i.status === 'error') &&
        i.file instanceof File
    );

    if (staged.length === 0) {
      return { success: [], failed: [], totalCommits: 0, batches: [] };
    }

    setIsCommitting(true);
    setCommitProgress({ done: 0, total: staged.length });
    setBatchProgress(null);

    // committing olarak işaretle
    setQueue((prev) =>
      prev.map((i) =>
        staged.some((s) => s.uid === i.uid)
          ? { ...i, status: 'committing' as const }
          : i
      )
    );

    const result = await commitStagedItems(staged, {
      onProgress: (done, total) => {
        setCommitProgress({ done, total });
      },
      onItemDone: (committedItem, audioFile) => {
        setQueue((prev) =>
          prev.map((i) =>
            i.uid === committedItem.uid
              ? { ...committedItem, status: 'committed' as const }
              : i
          )
        );
        const cb = callbacksRef.current.get(committedItem.uid);
        if (cb) {
          if (committedItem.type === 'source') {
            (cb as OnSourceCommitted)(committedItem as StagedSourceItem, audioFile);
          } else {
            (cb as OnRecordedCommitted)(committedItem as StagedRecordedItem, audioFile);
          }
          callbacksRef.current.delete(committedItem.uid);
        }
      },
      onBatchDone: (batch: BatchInfo) => {
        setBatchProgress({ current: batch.batchIndex, total: batch.batchTotal });
      },
    });

    // Hatalıları işaretle
    if (result.failed.length > 0) {
      setQueue((prev) =>
        prev.map((i) => {
          const failed = result.failed.find((f) => f.item.uid === i.uid);
          return failed
            ? { ...i, status: 'error' as const, errorMessage: failed.error }
            : i;
        })
      );
    }

    setIsCommitting(false);
    setCommitProgress({ done: 0, total: 0 });

    // Başarı durumunda persist temizle
    if (result.failed.length === 0 && result.success.length > 0) {
      clearPersisted(userId);
    }

    return result;
  }, [queue, userId]);

  // ── Temizlik ─────────────────────────────────────────────────
  const clearErrors = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status !== 'error'));
  }, []);

  const clearCommitted = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status !== 'committed'));
  }, []);

  // ── lineId → staged uid ──────────────────────────────────────
  const getStagedUidForLine = useCallback(
    (lineId: string): string | null => {
      const found = queue.find(
        (i) =>
          i.type === 'recorded' &&
          (i as StagedRecordedItem).lineId === lineId &&
          (i.status === 'staged' || i.status === 'committing')
      );
      return found ? found.uid : null;
    },
    [queue]
  );

  const pendingCount = queue.filter(
    (i) => i.status === 'staged' || i.status === 'committing'
  ).length;

  const value: StagingContextValue = {
    queue,
    pendingCount,
    isCommitting,
    commitProgress,
    batchProgress,
    stageSource,
    stageRecorded,
    unstage,
    commitAll,
    clearErrors,
    clearCommitted,
    getStagedUidForLine,
  };

  return (
    <StagingContext.Provider value={value}>
      {children}
    </StagingContext.Provider>
  );
}
