// ============================================================
// BULK UPLOAD MODAL – Phase 8 (Staging)
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload,
  ChevronDown, ChevronUp, Trash2, RefreshCw, Package,
} from 'lucide-react';
import { Modal }          from '../ui/Modal';
import { Button }         from '../ui/Button';
import { FileDropZone }   from './FileDropZone';
import { UploadQueueItem } from './UploadQueueItem';
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

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  character: Character;
  task: Task;
  onSuccess?: (result: BulkUploadResult) => void;
}

type Phase = 'select' | 'review' | 'staged';

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

  const existingFileNames = new Set(
    (task.lines ?? [])
      .map((l) => l.sourceFile?.fileName?.toLowerCase())
      .filter(Boolean) as string[]
  );

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

  const handleStageAll = useCallback(() => {
    if (!currentUser) return;

    const toStage = entries.filter(
      (e) => e.status === 'queued' || e.status === 'duplicate'
    );

    let stagedCount = 0;

    for (const entry of toStage) {
      stageSource(
        entry.file,
        {
          projectId,
          projectTitle,
          characterId: character.id,
          taskId: task.id,
          uploadedBy: currentUser.id,
        },
        async (_committedItem, audioFile) => {
          await bulkUploadSourceFiles(projectId, task.id, [audioFile]);

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

    const result: BulkUploadResult = {
      taskId: task.id,
      characterId: character.id,
      totalFiles: entries.length,
      stagedFiles: toStage.length,
      skippedFiles: entries.filter((e) => e.status === 'skipped').length,
    };

    onSuccess?.(result);
    onClose();
  }, [currentUser, entries, stageSource, projectId, projectTitle, character, task, bulkUploadSourceFiles, notify, onSuccess, onClose]);

  const queuedCount   = entries.filter((e) => e.status === 'queued').length;
  const duplicateCount = entries.filter((e) => e.status === 'duplicate').length;
  const skippedCount  = entries.filter((e) => e.status === 'skipped').length;
  const totalSize     = entries.reduce((s, e) => s + e.fileSize, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Toplu Ses Yükle — ${character.name}`}
      size="lg"
    >
      <div className="space-y-4">
        {phase === 'select' ? (
          <FileDropZone onFilesSelected={handleFilesSelected} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Package size={14} />
                <span>{entries.length} dosya · {formatFileSize(totalSize)}</span>
                {duplicateCount > 0 && (
                  <span className="text-amber-400">· {duplicateCount} kopya</span>
                )}
                {skippedCount > 0 && (
                  <span style={{ color: 'var(--text-muted)' }}>· {skippedCount} atlandı</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.wav,.mp3,.flac,.aiff,.ogg,.m4a';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files ?? []);
                      if (files.length > 0) handleFilesSelected(files);
                    };
                    input.click();
                  }}
                >
                  Dosya Ekle
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={handleClearAll}
                >
                  Temizle
                </Button>
                <button
                  onClick={() => setShowQueue((v) => !v)}
                  className="p-1 rounded transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                  type="button"
                >
                  {showQueue ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {showQueue && (
              <div ref={queueRef} className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {entries.map((entry, i) => (
                  <UploadQueueItem
                    key={entry.uid}
                    entry={entry}
                    index={i}
                    onRemove={handleRemove}
                    onSkip={handleSkip}
                    isUploading={false}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--border-base)' }}>
              <Button variant="ghost" onClick={onClose}>
                İptal
              </Button>
              <Button
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={handleStageAll}
                disabled={queuedCount === 0 && duplicateCount === 0}
              >
                Staging'e Ekle ({queuedCount + duplicateCount})
              </Button>
            </div>
          </>
        )}

        {phase === 'select' && (
          <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--border-base)' }}>
            <Button variant="ghost" onClick={onClose}>
              İptal
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
