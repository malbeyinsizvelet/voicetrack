// ============================================================
// BULK UPLOAD MODAL — Phase 8 (Staging)
//
// Yeni akış:
//   1. Kullanıcı dosyaları seçer
//   2. Dosyalar staging queue'ya eklenir (HF'ye GİTMEZ)
//   3. StagingBar'da "N dosya hazır → Toplu Gönder" görünür
//   4. Kullanıcı StagingBar'dan "Toplu Gönder" basınca TEK commit ile HF'ye gider
//   5. Modal kapanır
//
// Proje klasör yapısı: hfPathService.ts (Project RE7/Originals/...)
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  ChevronDown, ChevronUp, Trash2, RefreshCw, Package,
} from 'lucide-react';
import { Modal }          from '../ui/Modal';
import { Button }         from '../ui/Button';
import { FileDropZone }   from './FileDropZone';
import { UploadQueueItem, DuplicateWarning } from './UploadQueueItem';
import { useProjects }    from '../../context/ProjectContext';
import { useAuth }        from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useStaging }     from '../../context/StagingContext';
import {
  buildUploadEntries,
  revokeEntryUrls,
  formatFileSize,
} from '../../services/audioUploadService';
import type { UploadedFileEntry, BulkUploadResult, Character, Task } from '../../types';

// ─── Props ───────────────────────────────────────────────────
interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;           // HF klasör adı için
  character: Character;
  task: Task;
  onSuccess?: (result: BulkUploadResult) => void;
}

type Phase = 'select' | 'review' | 'staged';

// ─── Component ───────────────────────────────────────────────
export function BulkUploadModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  character,
  task,
  onSuccess,
}: BulkUploadModalProps) {
  const { bulkUploadSourceFiles }   = useProjects();
  const { currentUser }             = useAuth();
  const { notify }                  = useNotifications();
  const { stageSource }             = useStaging();

  const [phase, setPhase]           = useState<Phase>('select');
  const [entries, setEntries]       = useState<UploadedFileEntry[]>([]);
  const [showQueue, setShowQueue]   = useState(true);
  const queueRef                    = useRef<HTMLDivElement>(null);

  // Mevcut dosya adları (duplicate tespiti)
  const existingFileNames = new Set(
    (task.lines ?? [])
      .map((l) => l.sourceFile?.fileName?.toLowerCase())
      .filter(Boolean) as string[]
  );

  // Modal kapanınca temizle
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        revokeEntryUrls(entries);
        setEntries([]);
        setPhase('select');
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dosya ekleme ─────────────────────────────────────────
  const handleFilesSelected = useCallback((files: File[]) => {
    const currentNames = new Set([
      ...Array.from(existingFileNames),
      ...entries.map((e) => e.fileName.toLowerCase()),
    ]);
    const newEntries = buildUploadEntries(files, currentNames);
    setEntries((prev) => [...prev, ...newEntries]);
    setPhase('review');
  }, [entries, existingFileNames]);

  const handleRemove = useCallback((uid: string) => {
    setEntries((prev) => {
      const removed = prev.find((e) => e.uid === uid);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((e) => e.uid !== uid);
    });
  }, []);

  const handleSkip = useCallback((uid: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.uid === uid ? { ...e, status: 'skipped' } : e))
    );
  }, []);

  const handleClearAll = useCallback(() => {
    revokeEntryUrls(entries);
    setEntries([]);
    setPhase('select');
  }, [entries]);

  // ── STAGING — dosyaları queue'ya ekle (HF'ye gönderme!) ──
  const handleStageAll = useCallback(() => {
    if (!currentUser) return;

    const toStage = entries.filter(
      (e) => e.status === 'queued' || e.status === 'duplicate'
    );

    let stagedCount = 0;

    for (const entry of toStage) {
      // StagingContext'e ekle — commit StagingBar'dan yapılacak
      stageSource(
        entry.file,
        {
          projectId,
          projectTitle,
          characterId: character.id,
          taskId: task.id,
          uploadedBy: currentUser.id,
        },
        // Commit tamamlandığında context'e yaz
        async (_committedItem, audioFile) => {
          await bulkUploadSourceFiles(projectId, task.id, [audioFile]);

          // Bildirim (tek seferlik — ilk dosyada yeterli)
          if (stagedCount === 0) {
            notify({
              type: 'artist_uploaded',
              title: 'Kaynak Ses Yüklendi',
              body: `${character.name} için sesler Hugging Face'e gönderildi.`,
              targetRole: 'qc_reviewer',
              meta: { projectId, characterName: character.name },
            });
          }
          stagedCount++;
        }
      );
    }

    // Özet
    const result: BulkUploadResult = {
      taskId: task.id,
      characterId: character.id,
      totalFiles: entries.length,
      successCount: toStage.length,
      errorCount: entries.filter((e) => e.status === 'error').length,
      duplicateCount: entries.filter((e) => e.status === 'duplicate').length,
      skippedCount: 0,
      newLineCount: toStage.length,
    };

    onSuccess?.(result);
    setPhase('staged');
  }, [
    entries, currentUser, projectId, projectTitle,
    character, task, stageSource, bulkUploadSourceFiles,
    notify, onSuccess,
  ]);

  // ── İstatistikler ─────────────────────────────────────────
  const valid      = entries.filter((e) => e.status === 'queued');
  const dupes      = entries.filter((e) => e.status === 'duplicate');
  const errors     = entries.filter((e) => e.status === 'error');
  const totalBytes = valid.reduce((s, e) => s + e.fileSize, 0);

  // ── Render ────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kaynak Ses Yükle"
      subtitle={`${character.name} · ${task.id}`}
      size="xl"
    >
      <div className="flex flex-col gap-4" style={{ minHeight: 320 }}>

        {/* ── select ── */}
        {phase === 'select' && (
          <FileDropZone
            onFilesSelected={handleFilesSelected}
          />
        )}

        {/* ── review ── */}
        {phase === 'review' && (
          <>
            {/* Özet satırı */}
            <div
              className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <span style={{ color: 'var(--text-primary)' }}>
                <strong>{valid.length}</strong> dosya
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{formatFileSize(totalBytes)}</span>
              {dupes.length > 0 && (
                <span style={{ color: 'var(--text-secondary)' }}>
                  {dupes.length} kopya
                </span>
              )}
              {errors.length > 0 && (
                <span style={{ color: 'var(--text-primary)' }}>
                  {errors.length} hata
                </span>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setPhase('select')}
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
                type="button"
              >
                + Daha fazla ekle
              </button>
            </div>

            {dupes.length > 0 && (
              <DuplicateWarning count={dupes.length} />
            )}

            {/* Kuyruk listesi */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Dosya Listesi ({entries.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAll}
                  className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                  type="button"
                >
                  <Trash2 size={11} /> Temizle
                </button>
                <button
                  onClick={() => setShowQueue((s) => !s)}
                  className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                  type="button"
                >
                  {showQueue ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {showQueue ? 'Gizle' : 'Göster'}
                </button>
              </div>
            </div>

            {showQueue && (
              <div
                ref={queueRef}
                className="space-y-1 max-h-64 overflow-y-auto pr-1"
              >
                {entries.map((entry, idx) => (
                  <UploadQueueItem
                    key={entry.uid}
                    entry={entry}
                    index={idx}
                    onRemove={handleRemove}
                    onSkip={handleSkip}
                    isUploading={false}
                  />
                ))}
              </div>
            )}

            {/* Footer aksiyonları */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <Button variant="ghost" onClick={onClose} size="sm">
                İptal
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhase('select')}
                  leftIcon={<RefreshCw size={13} />}
                >
                  Tekrar Seç
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStageAll}
                  disabled={valid.length === 0 && dupes.length === 0}
                  leftIcon={<Package size={13} />}
                >
                  Kuyruğa Ekle ({valid.length + dupes.length})
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── staged ── */}
        {phase === 'staged' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <Package size={28} style={{ color: 'var(--text-primary)' }} />
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {valid.length + dupes.length} dosya kuyruğa eklendi
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Ekranın altındaki çubuktan "Toplu Gönder" butonuyla Hugging Face'e gönderin.
              </p>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm w-full max-w-sm"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <Upload size={15} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                Staging çubuğu aşağıda görünüyor
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={onClose}>
              Tamam
            </Button>
          </div>
        )}

        {/* ── select'te sürükle-bırak metin ipucu ── */}
        {phase === 'select' && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Dosyaları sürükleyip bırakabilir veya klasör seçebilirsiniz.
              Desteklenen formatlar: .wav, .mp3, .m4a, .ogg, .flac, .aif
            </p>
            {entries.length > 0 && (
              <button
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setPhase('review')}
                type="button"
              >
                ← Seçilen dosyalara dön ({entries.length})
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
