// ============================================================
// RECORDING LINE ROW — Phase 6
// - Tüm hardcoded renkler CSS variable'lara taşındı
// - QC notu net gösterildi (qcNote alanı)
// - "QC Onayla (yakında)" placeholder butonları kaldırıldı
// - Versiyon sayısı satır üzerinde gösteriliyor
// ============================================================

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Clock4,
  FileAudio,
  Upload as UploadIcon,
  Mic2,
  History,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LineStatusBadge }  from './LineStatusBadge';
import { ArtistUploadModal } from './ArtistUploadModal';
import { DownloadButton }   from './DownloadButton';
import { FileDownloadPanel } from './FileDownloadPanel';
import type { RecordingLine, UserRole } from '../../types';
import { cn } from '../../utils/cn';
import { useStaging } from '../../context/StagingContext';

interface Props {
  line: RecordingLine;
  projectId: string;
  projectTitle?: string;
  characterId?: string;
  taskId: string;
  canWrite?: boolean;
  canUpload?: boolean;
  userRole?: UserRole;
  userId?: string;
  artistId?: string;
  artistName?: string;
  onUploadDone?: (lineId: string, audioFileId: string) => Promise<void>;
  highlight?: boolean;
}

export function RecordingLineRow({
  line,
  projectId,
  projectTitle = '',
  characterId = '',
  taskId,
  canWrite: _canWrite = false,
  canUpload    = false,
  userRole     = 'voice_artist',
  userId       = '',
  artistId     = '',
  artistName   = '',
  onUploadDone,
  highlight    = false,
}: Props) {
  const [expanded, setExpanded]         = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { getStagedUidForLine } = useStaging();
  const stagedUid = getStagedUidForLine(line.id);

  const hasSource    = !!line.sourceFile;
  const hasRecording = !!line.recordedFile;
  const hasNotes     = !!(line.directorNote || line.artistNote || line.qcNote);
  const hasText      = !!(line.originalText || line.translatedText);
  const isExpandable = hasSource || hasRecording || hasNotes || hasText || canUpload;
  const versionCount = line.versions?.length ?? 0;

  // QC kararı var mı
  const hasQCDecision = line.status === 'approved' || line.status === 'rejected' || line.status === 'retake';
  const isQCApproved  = line.status === 'approved';
  const isQCRejected  = line.status === 'rejected' || line.status === 'retake';

  const handleUploadDone = async (lineId: string, audioFileId: string) => {
    setUploadModalOpen(false);
    await onUploadDone?.(lineId, audioFileId);
  };

  // Sol border — satır durumuna göre
  const leftBorder: Record<string, string> = {
    pending:  'border-l-[var(--border)]',
    recorded: 'border-l-[var(--text-secondary)]',
    approved: 'border-l-[var(--text-primary)]',
    rejected: 'border-l-[var(--text-secondary)]',
    retake:   'border-l-[var(--text-secondary)]',
  };
  const borderClass = leftBorder[line.status] ?? 'border-l-[var(--border)]';

  return (
    <>
      <div
        className={cn(
          'border-l-2 rounded-r-lg transition-colors',
          borderClass,
          highlight && 'ring-1 ring-offset-0'
        )}
        style={{
          background:  expanded ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          ...(highlight ? { outlineColor: 'var(--border-strong)' } : {}),
        }}
      >
        {/* ── Ana satır ─────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5',
            isExpandable && 'cursor-pointer select-none'
          )}
          onClick={() => isExpandable && setExpanded((p) => !p)}
        >
          {/* Expand chevron */}
          <span className="shrink-0 w-3.5" style={{ color: 'var(--text-muted)' }}>
            {isExpandable
              ? expanded
                ? <ChevronDown className="w-3.5 h-3.5" />
                : <ChevronRight className="w-3.5 h-3.5" />
              : null}
          </span>

          {/* Satır numarası */}
          <span
            className="text-xs font-mono font-semibold shrink-0 w-8 text-center rounded-md py-0.5"
            style={{
              background: line.status === 'approved'
                ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
              color: line.status === 'approved'
                ? 'var(--text-primary)'
                : line.status === 'rejected' || line.status === 'retake'
                ? 'var(--text-secondary)'
                : line.status === 'recorded'
                ? 'var(--text-primary)'
                : 'var(--text-muted)',
            }}
          >
            {String(line.lineNumber).padStart(2, '0')}
          </span>

          {/* Timecode */}
          {line.timecode ? (
            <span className="text-[11px] font-mono shrink-0 hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
              {line.timecode}
            </span>
          ) : (
            <span className="w-[72px] hidden sm:inline" />
          )}

          {/* Ana içerik */}
          <div className="flex-1 min-w-0">
            {line.translatedText ? (
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                {line.translatedText}
              </p>
            ) : line.originalText ? (
              <p className="text-sm italic truncate" style={{ color: 'var(--text-muted)' }}>
                {line.originalText}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                Metin girilmemiş
              </p>
            )}
          </div>

          {/* Sağ — meta + hızlı aksiyonlar */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Staged badge */}
            {stagedUid && (
              <span
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
                title="Kuyruğa alındı — Toplu Gönder ile gönderilecek"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                <Clock4 className="w-2.5 h-2.5" />
                Bekliyor
              </span>
            )}

            {/* Retake sayacı */}
            {line.retakeCount > 0 && (
              <span
                className="flex items-center gap-0.5 text-[10px]"
                title={`${line.retakeCount} retake`}
                style={{ color: 'var(--text-muted)' }}
              >
                <RefreshCw className="w-2.5 h-2.5" />
                {line.retakeCount}
              </span>
            )}

            {/* Versiyon sayısı */}
            {versionCount > 1 && (
              <span
                className="flex items-center gap-0.5 text-[10px]"
                title={`${versionCount} versiyon`}
                style={{ color: 'var(--text-muted)' }}
              >
                <History className="w-2.5 h-2.5" />
                v{versionCount}
              </span>
            )}

            {/* Not var mı */}
            {hasNotes && (
              <span title="Not var" style={{ color: 'var(--text-muted)' }}>
                <MessageSquare className="w-3 h-3" />
              </span>
            )}

            {/* QC karar ikonları — sanatçıya net göster */}
            {canUpload && hasQCDecision && (
              isQCApproved ? (
                <span title="Onaylandı" style={{ color: 'var(--text-primary)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              ) : isQCRejected ? (
                <span title="Revize istendi" style={{ color: 'var(--text-secondary)' }}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
              ) : null
            )}

            {/* Kaynak ses: icon indirme */}
            {hasSource && line.sourceFile && (
              <DownloadButton
                file={line.sourceFile}
                type="source"
                userRole={userRole}
                userId={userId}
                variant="icon"
              />
            )}

            {/* Kayıt alınan ses: icon indirme */}
            {hasRecording && line.recordedFile && (
              <DownloadButton
                file={line.recordedFile}
                type="recorded"
                userRole={userRole}
                userId={userId}
                ownerId={artistId}
                variant="icon"
              />
            )}

            {/* Kayıt mevcut göstergesi */}
            {hasRecording && !canUpload && (
              <span title="Kayıt mevcut" style={{ color: 'var(--text-muted)' }}>
                <FileAudio className="w-3 h-3" />
              </span>
            )}

            {/* Sanatçı: yükle / güncelle butonu */}
            {canUpload && !hasRecording && (
              <button
                onClick={() => setUploadModalOpen(true)}
                title="Kaydı Yükle"
                className="flex items-center justify-center w-7 h-7 rounded-md transition-all border border-transparent vt-hover"
                style={{ color: 'var(--text-muted)' }}
              >
                <UploadIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {canUpload && hasRecording && (
              <button
                onClick={() => setUploadModalOpen(true)}
                title="Kaydı Güncelle"
                className="flex items-center justify-center w-7 h-7 rounded-md transition-all border border-transparent vt-hover"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Mic2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Durum badge */}
            <LineStatusBadge status={line.status} size="xs" />
          </div>
        </div>

        {/* ── Genişletilmiş detay ────────────────────────── */}
        {expanded && isExpandable && (
          <div
            className="px-4 pb-3 space-y-3 border-t pt-3"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* QC kararı bandı — sanatçıya özel */}
            {canUpload && hasQCDecision && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg border"
                style={{
                  background:  'var(--bg-base)',
                  borderColor: 'var(--border-strong)',
                }}
              >
                {isQCApproved ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }} />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {isQCApproved ? 'Onaylandı' : 'Revize istendi'}
                  </p>
                  {line.qcNote && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {line.qcNote}
                    </p>
                  )}
                  {line.reviewedBy && (
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      QC: {line.reviewedBy}
                      {line.reviewedAt ? ` · ${new Date(line.reviewedAt).toLocaleDateString('tr-TR')}` : ''}
                    </p>
                  )}
                  {isQCRejected && (
                    <p className="text-[10px] mt-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Yeni kayıt yüklemen gerekiyor.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Metinler */}
            {(line.originalText || line.translatedText) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {line.originalText && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                      Orijinal
                    </p>
                    <p className="text-sm leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                      &ldquo;{line.originalText}&rdquo;
                    </p>
                  </div>
                )}
                {line.translatedText && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                      Türkçe
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      &ldquo;{line.translatedText}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* İki ayrı indirme paneli */}
            <FileDownloadPanel
              sourceFile={line.sourceFile}
              recordedFile={line.recordedFile}
              userRole={userRole}
              userId={userId}
              ownerId={artistId}
              layout="row"
              showMeta
            />

            {/* Sanatçı kayıt yükleme butonu */}
            {canUpload && (
              <button
                onClick={() => setUploadModalOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed text-sm transition-all vt-hover"
                style={{
                  borderColor: 'var(--border-strong)',
                  color:       'var(--text-secondary)',
                }}
              >
                {hasRecording ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Kaydı Güncelle
                    {versionCount > 0 && (
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                        v{versionCount} → v{versionCount + 1}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-3.5 h-3.5" />
                    Kaydı Yükle
                  </>
                )}
              </button>
            )}

            {/* Versiyon geçmişi (satır bazında) */}
            {versionCount > 0 && (
              <div
                className="rounded-lg border overflow-hidden"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider flex items-center gap-1.5"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  <History className="w-3 h-3" />
                  {versionCount} versiyon
                </div>
                {[...(line.versions ?? [])].sort((a, b) => b.version - a.version).map((v) => (
                  <div
                    key={v.version}
                    className="flex items-center gap-2 px-3 py-2 border-t text-xs"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span
                      className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      v{v.version}
                    </span>
                    <span className="flex-1 font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                      {v.file.fileName}
                    </span>
                    {v.qcStatus && v.qcStatus !== 'pending' && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
                      >
                        {v.qcStatus === 'approved' ? '✓ Onaylı' : '↩ Red'}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(v.uploadedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Notlar (direktör / sanatçı) */}
            {(line.directorNote || line.artistNote) && (
              <div className="space-y-2">
                {line.directorNote && (
                  <div className="flex gap-2">
                    <span
                      className="text-[10px] shrink-0 mt-0.5 uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Yönetmen:
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {line.directorNote}
                    </p>
                  </div>
                )}
                {line.artistNote && (
                  <div className="flex gap-2">
                    <span
                      className="text-[10px] shrink-0 mt-0.5 uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Sanatçı:
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {line.artistNote}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Timecode */}
            {line.timecode && (
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <Clock4 className="w-3 h-3" />
                <span className="font-mono">{line.timecode}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Artist Upload Modal ──────────────────────────────── */}
      {canUpload && (
        <ArtistUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          line={line}
          projectId={projectId}
          projectTitle={projectTitle}
          characterId={characterId}
          taskId={taskId}
          artistId={artistId}
          artistName={artistName}
          onUploaded={handleUploadDone}
        />
      )}
    </>
  );
}
