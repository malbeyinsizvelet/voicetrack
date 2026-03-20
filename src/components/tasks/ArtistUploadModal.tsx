// ============================================================
// ARTIST UPLOAD MODAL — Phase 9
// Staging sistemi: dosya seçilince HF'ye gitmez,
// queue'ya alınır. StagingBar'dan toplu gönderilir.
// ============================================================

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Mic2,
  StickyNote,
  Clock,
  RefreshCw,
  MessageSquare,
  History,
} from 'lucide-react';
import { Modal }   from '../ui/Modal';
import { Button }  from '../ui/Button';
import type { RecordingLine } from '../../types';
import {
  validateAudioFile,
  formatFileSize,
  getExtension,
  ACCEPTED_EXTENSIONS,
} from '../../services/audioUploadService';
import { useSettings }  from '../../context/SettingsContext';
import { useStaging }   from '../../context/StagingContext';

// ─── Types ────────────────────────────────────────────────────
type UploadState = 'idle' | 'selected' | 'staged' | 'error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  line: RecordingLine | null;
  projectId: string;
  projectTitle: string;
  characterId: string;
  taskId: string;
  artistId: string;
  artistName: string;
  onUploaded: (lineId: string, audioFileId: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────
export function ArtistUploadModal({
  isOpen,
  onClose,
  line,
  projectId,
  projectTitle,
  characterId,
  taskId,
  artistId,
  artistName: _artistName,
  onUploaded,
}: Props) {
  const { settings }                          = useSettings();
  const { stageRecorded, getStagedUidForLine } = useStaging();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState]   = useState<UploadState>('idle');
  const [artistNote, setArtistNote]     = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging]     = useState(false);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setUploadState('idle');
    setArtistNote('');
    setErrorMessage('');
    onClose();
  }, [onClose]);

  // ── Dosya seçim ──────────────────────────────────────────

  const handleFileSelect = useCallback((file: File) => {
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error ?? 'Geçersiz dosya.');
      setUploadState('error');
      return;
    }
    setSelectedFile(file);
    setUploadState('selected');
    setErrorMessage('');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Stage (kuyruğa ekle) ─────────────────────────────────

  const handleStage = useCallback(() => {
    if (!selectedFile || !line) return;

    const versionNumber = (line.versions ?? []).length + 1;

    stageRecorded(
      selectedFile,
      {
        projectId,
        projectTitle,
        characterId,
        taskId,
        lineId: line.id,
        versionNumber,
        uploadedBy: artistId,
        artistNote: artistNote.trim() || undefined,
      },
      // Commit tamamlandığında ProjectContext'i güncelle
      async (_item, audioFile) => {
        await onUploaded(line.id, audioFile.id);
      }
    );

    setUploadState('staged');
  }, [
    selectedFile,
    line,
    stageRecorded,
    projectId,
    projectTitle,
    characterId,
    taskId,
    artistId,
    artistNote,
    onUploaded,
  ]);

  if (!line) return null;

  const versionCount  = (line.versions ?? []).length;
  const isRetake      = line.retakeCount > 0 || line.status === 'rejected';
  const newVersionNum = versionCount + 1;
  const showQCNote    = settings.qc.showQCNotesToArtist && line.qcNote;

  // Bu satır zaten staged mi?
  const alreadyStagedUid = getStagedUidForLine(line.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isRetake
          ? `Tekrar Kayıt Yükle — Versiyon ${newVersionNum}`
          : 'Kayıt Yükle'
      }
      subtitle={`Satır #${line.lineNumber}${line.timecode ? ` · ${line.timecode}` : ''}`}
    >
      <div className="space-y-4">

        {/* Zaten staged uyarısı */}
        {alreadyStagedUid && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Clock size={14} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
            Bu satır için bir kayıt zaten kuyruğa alınmış.
            Göndermek için sayfanın altındaki çubuğu kullan.
          </div>
        )}

        {/* Retake bandı */}
        {isRetake && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <RefreshCw size={14} style={{ flexShrink: 0 }} />
            <span>
              {line.retakeCount > 0
                ? `${line.retakeCount} retake istendi.`
                : 'Revize istendi.'}{' '}
              {versionCount > 0 && `Mevcut: v${versionCount}`}
            </span>
          </div>
        )}

        {/* QC notu */}
        {showQCNote && (
          <div
            className="rounded-xl p-3 space-y-1"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare size={12} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                QC Notu
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {line.qcNote}
            </p>
            {line.reviewedBy && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {line.reviewedBy}
                {line.reviewedAt
                  ? ` · ${new Date(line.reviewedAt).toLocaleDateString('tr-TR')}`
                  : ''}
              </p>
            )}
          </div>
        )}

        {/* Replik bilgisi */}
        {(line.originalText || line.translatedText) && (
          <div
            className="rounded-xl p-4 space-y-1.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            {line.originalText && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {line.originalText}
              </p>
            )}
            {line.translatedText && (
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {line.translatedText}
              </p>
            )}
          </div>
        )}

        {/* Versiyon geçmişi */}
        {versionCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <History size={12} />
            <span>{versionCount} önceki versiyon</span>
            {line.versions?.map((_v, i) => (
              <span
                key={`v${i + 1}`}
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                v{i + 1}
              </span>
            ))}
          </div>
        )}

        {/* Drop Zone */}
        {uploadState !== 'staged' && (
          <div
            className="relative rounded-xl border-2 border-dashed transition-colors cursor-pointer"
            style={{
              borderColor: isDragging ? 'var(--text-secondary)' : 'var(--border)',
              background: isDragging ? 'var(--bg-elevated)' : 'transparent',
              minHeight: 140,
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              onChange={handleInputChange}
              className="sr-only"
            />

            <div className="flex flex-col items-center justify-center gap-3 p-8">
              {selectedFile ? (
                <>
                  <FileAudio
                    size={28}
                    style={{ color: 'var(--text-secondary)' }}
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedFile.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatFileSize(selectedFile.size)}
                      {' · '}
                      {getExtension(selectedFile.name).toUpperCase()}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Farklı dosya seçmek için tıkla
                  </p>
                </>
              ) : (
                <>
                  <Mic2 size={28} style={{ color: 'var(--text-muted)' }} />
                  <div className="text-center">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Kayıt dosyasını sürükle veya tıkla
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {ACCEPTED_EXTENSIONS.join(', ')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Staged durumu */}
        {uploadState === 'staged' && (
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <Clock size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Kuyruğa alındı
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {selectedFile?.name} — Sayfanın altındaki çubuktan toplu gönder
              </p>
            </div>
          </div>
        )}

        {/* Hata */}
        {uploadState === 'error' && errorMessage && (
          <div
            className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <AlertCircle size={15} style={{ color: 'var(--text-primary)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{errorMessage}</span>
          </div>
        )}

        {/* Sanatçı notu */}
        {(uploadState === 'selected' || uploadState === 'idle') && (
          <div className="space-y-1.5">
            <label
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              <StickyNote size={12} />
              Sanatçı Notu (İsteğe Bağlı)
            </label>
            <textarea
              value={artistNote}
              onChange={(e) => setArtistNote(e.target.value)}
              rows={2}
              placeholder="QC veya yönetmene not bırak..."
              className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              maxLength={500}
            />
          </div>
        )}

        {/* Desteklenen formatlar */}
        <div className="flex items-center gap-3 flex-wrap">
          {ACCEPTED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
            >
              <FileAudio size={10} />
              {ext.replace('.', '').toUpperCase()}
            </span>
          ))}
        </div>

        {/* Butonlar */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            {uploadState === 'staged' ? 'Kapat' : 'İptal'}
          </Button>

          {uploadState === 'selected' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStage}
              leftIcon={<Upload size={14} />}
            >
              Kuyruğa Ekle
            </Button>
          )}

          {uploadState === 'staged' && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <CheckCircle2 size={14} />
              Kuyruğa alındı
            </div>
          )}

          {uploadState === 'error' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setUploadState('idle');
                setErrorMessage('');
                setSelectedFile(null);
              }}
            >
              Tekrar Dene
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
