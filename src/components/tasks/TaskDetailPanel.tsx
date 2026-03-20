// ============================================================
// TASK DETAIL PANEL — Phase 6
// - Tüm hardcoded renkler CSS variable'lara taşındı
// - Versiyon geçmişi UI eklendi (versions[])
// - QC kararı sanatçıya net gösterildi
// - "Yakında" placeholder butonları kaldırıldı
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  User,
  Calendar,
  FileAudio,
  Mic2,
  StickyNote,
  ChevronUp,
  ChevronDown,
  Upload,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { LINE_STATUS_CONFIG } from './LineStatusBadge';
import { RecordingLineRow }   from './RecordingLineRow';
import { FileDownloadPanel }  from './FileDownloadPanel';
import { LineFilterBar }      from './LineFilterBar';
import { Badge }              from '../ui/Badge';
import { DownloadButton }     from './DownloadButton';
import type {
  Task, LineStatus, AudioFile, UserRole, LineFilter, RecordingVersion,
} from '../../types';
import { DEFAULT_LINE_FILTER, filterLines } from '../../services/filterService';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  formatDate,
  formatFileSize,
  formatRelativeDate,
} from '../../utils/formatters';

interface Props {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  canWrite?: boolean;
  canUpload?: boolean;
  userRole?: UserRole;
  userId?: string;
  artistId?: string;
  artistName?: string;
  projectId?: string;
  characterId?: string;
  onUploadRecording?: (
    taskId: string,
    lineId: string,
    file: AudioFile,
    artistNote?: string
  ) => Promise<void>;
}

// ─── Satır istatistiği ───────────────────────────────────────
function lineStats(task: Task) {
  const lines    = task.lines ?? [];
  const total    = lines.length;
  const byStatus = lines.reduce<Record<LineStatus, number>>(
    (acc, l) => ({ ...acc, [l.status]: (acc[l.status] ?? 0) + 1 }),
    { pending: 0, recorded: 0, approved: 0, rejected: 0, retake: 0 }
  );
  const recorded = byStatus.recorded + byStatus.approved;
  const approved = byStatus.approved;
  const pct      = total > 0 ? Math.round((recorded / total) * 100) : 0;
  return { total, byStatus, recorded, approved, pct };
}

// ─── QC durumu bandı (sanatçıya özel) ────────────────────────
function QCStatusBand({ task }: { task: Task }) {
  const isApproved = task.status === 'qc_approved';
  const isRejected = task.status === 'qc_rejected';
  if (!isApproved && !isRejected) return null;

  // Reddedilen satırların QC notlarını topla
  const rejectedLines = (task.lines ?? []).filter(
    (l) => l.status === 'rejected' || l.status === 'retake'
  );
  const qcNotes = rejectedLines
    .map((l) => l.qcNote)
    .filter(Boolean) as string[];

  return (
    <div
      className="px-5 py-3 border-b"
      style={{
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-strong)',
      }}
    >
      <div className="flex items-start gap-2.5">
        {isApproved ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }} />
        ) : (
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isApproved ? 'Tüm kayıtlar onaylandı' : `${rejectedLines.length} satır revize istendi`}
          </p>
          {isRejected && qcNotes.length > 0 && (
            <div className="mt-2 space-y-1">
              {qcNotes.slice(0, 3).map((note, i) => (
                <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  · {note}
                </p>
              ))}
              {qcNotes.length > 3 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  +{qcNotes.length - 3} not daha
                </p>
              )}
            </div>
          )}
          {isRejected && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              İlgili satırları genişleterek QC notlarını görebilirsin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Versiyon geçmişi bileşeni ───────────────────────────────
function VersionHistory({ versions }: { versions: RecordingVersion[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!versions || versions.length === 0) return null;

  const sorted = [...versions].sort((a, b) => b.version - a.version);
  const latest = sorted[0];
  const older  = sorted.slice(1);

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Başlık */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors vt-hover"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
        onClick={() => setExpanded((p) => !p)}
      >
        <History className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">Versiyon Geçmişi</span>
        <span style={{ color: 'var(--text-muted)' }}>({versions.length} versiyon)</span>
        <span className="ml-auto">
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* En son versiyon — her zaman göster */}
      <VersionRow v={latest} isCurrent />

      {/* Eski versiyonlar — toggle */}
      {expanded && older.map((v) => <VersionRow key={v.version} v={v} />)}
    </div>
  );
}

function VersionRow({ v, isCurrent }: { v: RecordingVersion; isCurrent?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 border-t text-xs"
      style={{
        borderColor: 'var(--border)',
        background: isCurrent ? 'var(--bg-surface)' : 'transparent',
      }}
    >
      {/* Versiyon badge */}
      <span
        className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px]"
        style={{
          background: isCurrent ? 'var(--text-primary)' : 'var(--bg-elevated)',
          color: isCurrent ? 'var(--bg-base)' : 'var(--text-muted)',
          border: '1px solid var(--border)',
        }}
      >
        v{v.version}
      </span>

      {/* Dosya adı */}
      <span className="flex-1 font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
        {v.file.fileName}
      </span>

      {/* QC durumu */}
      {v.qcStatus && v.qcStatus !== 'pending' && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded border"
          style={{
            borderColor: 'var(--border)',
            color: v.qcStatus === 'approved' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: 'var(--bg-elevated)',
          }}
        >
          {v.qcStatus === 'approved' ? '✓ Onaylı' : '↩ Red'}
        </span>
      )}

      {/* Tarih */}
      <span style={{ color: 'var(--text-muted)' }}>
        {formatRelativeDate(v.uploadedAt)}
      </span>

      {isCurrent && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          güncel
        </span>
      )}
    </div>
  );
}

// ─── Ana bileşen ─────────────────────────────────────────────
export function TaskDetailPanel({
  task,
  isOpen,
  onClose,
  canWrite   = false,
  canUpload  = false,
  userRole   = 'voice_artist',
  userId     = '',
  artistId   = '',
  artistName = '',
  projectId  = '',
  characterId = '',
  onUploadRecording,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const [lineFilter, setLineFilter]   = useState<LineFilter>({ ...DEFAULT_LINE_FILTER });
  const [showBulkFiles, setShowBulkFiles] = useState(true);
  const [showVersions, setShowVersions]   = useState(false);

  const [localTask, setLocalTask] = useState<Task | null>(task);
  useEffect(() => { setLocalTask(task); }, [task]);

  const handleLineUploaded = useCallback(async (
    lineId: string,
    audioFileId: string,
    artistNote?: string
  ) => {
    if (!localTask || !onUploadRecording) return;

    const mockFile: AudioFile = {
      id:         audioFileId,
      taskId:     localTask.id,
      type:       'recorded',
      fileName:   `recording_line_${lineId}_v${Date.now()}.wav`,
      fileSize:   Math.floor(Math.random() * 5_000_000) + 500_000,
      url:        `mock://storage/recorded/${lineId}_${audioFileId}.wav`,
      mimeType:   'audio/wav',
      uploadedBy: artistId,
      uploadedAt: new Date().toISOString(),
    };

    await onUploadRecording(localTask.id, lineId, mockFile, artistNote);

    setLocalTask((prev) => {
      if (!prev) return prev;
      const updatedLines = (prev.lines ?? []).map((l) => {
        if (l.id !== lineId) return l;
        const versions = [...(l.versions ?? []), {
          version:    (l.versions?.length ?? 0) + 1,
          file:       mockFile,
          uploadedAt: mockFile.uploadedAt,
          uploadedBy: artistId,
          qcStatus:   'pending' as const,
        }];
        return {
          ...l,
          status:      'recorded' as const,
          recordedFile: mockFile,
          versions,
          artistNote:  artistNote ?? l.artistNote,
          qcNote:      undefined,
          reviewedBy:  undefined,
          reviewedAt:  undefined,
          updatedAt:   new Date().toISOString(),
        };
      });
      const allRecorded = updatedLines.every(
        (l) => l.status === 'recorded' || l.status === 'approved'
      );
      return {
        ...prev,
        lines:     updatedLines,
        status:    allRecorded && updatedLines.length > 0 ? 'uploaded' : 'in_progress',
        updatedAt: new Date().toISOString(),
      };
    });
  }, [localTask, onUploadRecording, artistId]);

  if (!localTask) return null;

  const stats        = lineStats(localTask);
  const displayLines = filterLines(localTask.lines, lineFilter);
  const uploadedCount = (localTask.lines ?? []).filter(
    (l) => l.status === 'recorded' || l.status === 'approved'
  ).length;
  const pendingCount = (localTask.lines ?? []).filter(
    (l) => l.status === 'pending'
  ).length;
  const hasBulkFiles = localTask.sourceFiles.length > 0 || localTask.recordedFiles.length > 0;
  const totalSize    = [...localTask.sourceFiles, ...localTask.recordedFiles]
    .reduce((s, f) => s + f.fileSize, 0);

  // Tüm satırların versiyon geçmişi — yükleme olan satırlar
  const allVersions = (localTask.lines ?? [])
    .flatMap((l) => (l.versions ?? []).map((v) => ({ ...v, lineNumber: l.lineNumber })));

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-2xl flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-l ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background:   'var(--bg-base)',
          borderColor:  'var(--border)',
        }}
      >
        {/* ── Panel Header ────────────────────────────── */}
        <div
          className="flex items-start justify-between gap-4 px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                {localTask.characterName}
              </h2>
              <Badge
                label={TASK_STATUS_LABELS[localTask.status]}
                className={TASK_STATUS_COLORS[localTask.status]}
              />
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Kayıt Görevi · {localTask.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg transition-colors vt-hover"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ──────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── QC Durumu Bandı (sanatçıya özel) ────── */}
          {canUpload && <QCStatusBand task={localTask} />}

          {/* ── Meta bilgi ─────────────────────────── */}
          <div className="px-5 py-4 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                {localTask.assignedArtistName || (
                  <em style={{ color: 'var(--text-muted)' }}>Atanmamış</em>
                )}
              </span>
              {localTask.dueDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  {formatDate(localTask.dueDate)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Mic2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                {localTask.lineCount} replik
              </span>
            </div>

            {canUpload && (localTask.lines ?? []).length > 0 && (
              <div className="flex items-center gap-4 mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5 text-xs">
                  <Upload className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {uploadedCount}
                    </span>
                    /{(localTask.lines ?? []).length} yüklendi
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>
                    {pendingCount} bekliyor
                  </span>
                </div>
              </div>
            )}

            {localTask.notes && (
              <div
                className="flex gap-2 mt-2 rounded-lg px-3 py-2 border"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
              >
                <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {localTask.notes}
                </p>
              </div>
            )}
          </div>

          {/* ── İlerleme çubuğu ─────────────────────── */}
          {stats.total > 0 && (
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {canUpload ? 'Yükleme İlerlemesi' : 'Satır İlerlemesi'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {stats.recorded} / {stats.total} yüklendi · %{stats.pct}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width:           `${stats.pct}%`,
                    backgroundColor: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Durum pill'leri */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {(Object.keys(LINE_STATUS_CONFIG) as LineStatus[]).map((s) => {
                  const count = stats.byStatus[s] ?? 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setLineFilter((prev) => ({
                          ...prev,
                          status: prev.status === s ? 'all' : s,
                        }))
                      }
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition-all"
                      style={
                        lineFilter.status === s
                          ? { background: 'var(--text-primary)', color: 'var(--bg-base)', borderColor: 'var(--text-primary)' }
                          : { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)' }
                      }
                    >
                      {LINE_STATUS_CONFIG[s].label}
                      <span className="font-semibold">{count}</span>
                    </button>
                  );
                })}
                {lineFilter.status !== 'all' && (
                  <button
                    onClick={() => setLineFilter((prev) => ({ ...prev, status: 'all' }))}
                    className="text-[11px] px-2 py-0.5 rounded-full border transition-all"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    Tümü
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Sanatçı hızlı aksiyon bandı ─────────── */}
          {canUpload && (localTask.lines ?? []).length > 0 && pendingCount > 0 && (
            <div
              className="px-5 py-3 border-b"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--text-primary)' }}
                />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {pendingCount} replik
                  </span>{' '}
                  yükleme bekliyor. Satıra tıklayarak kayıt yükleyebilirsin.
                </p>
              </div>
            </div>
          )}

          {/* ── Toplu ses dosyaları ──────────────────── */}
          {hasBulkFiles && (
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <button
                className="flex items-center gap-2 text-xs w-full mb-3 transition-colors vt-hover"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setShowBulkFiles((p) => !p)}
              >
                <FileAudio className="w-3.5 h-3.5" />
                <span className="font-medium">Toplu Ses Dosyaları</span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  ({localTask.sourceFiles.length} kaynak
                  {localTask.recordedFiles.length > 0 && ` · ${localTask.recordedFiles.length} kayıt`}
                  {totalSize > 0 && ` · ${formatFileSize(totalSize)}`})
                </span>
                <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>
                  {showBulkFiles
                    ? <ChevronUp className="w-3.5 h-3.5" />
                    : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>

              {showBulkFiles && (
                <div className="space-y-3">
                  {localTask.sourceFiles.length <= 1 && localTask.recordedFiles.length <= 1 ? (
                    <FileDownloadPanel
                      sourceFile={localTask.sourceFiles[0]}
                      recordedFile={localTask.recordedFiles[0]}
                      userRole={userRole}
                      userId={userId}
                      ownerId={artistId || localTask.assignedTo}
                      layout="cards"
                      showMeta
                    />
                  ) : (
                    <div className="space-y-2">
                      {localTask.sourceFiles.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--text-muted)' }}>
                            <FileAudio className="w-3 h-3" />
                            Kaynak Sesler ({localTask.sourceFiles.length})
                          </p>
                          {localTask.sourceFiles.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                                  {f.fileName}
                                </p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                  {formatFileSize(f.fileSize)}
                                </p>
                              </div>
                              <DownloadButton
                                file={f} type="source"
                                userRole={userRole} userId={userId}
                                variant="compact"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {localTask.recordedFiles.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--text-muted)' }}>
                            <Mic2 className="w-3 h-3" />
                            Kayıt Sesler ({localTask.recordedFiles.length})
                          </p>
                          {localTask.recordedFiles.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                                  {f.fileName}
                                </p>
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                  {formatFileSize(f.fileSize)}
                                </p>
                              </div>
                              <DownloadButton
                                file={f} type="recorded"
                                userRole={userRole} userId={userId}
                                ownerId={artistId || localTask.assignedTo}
                                variant="compact"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Versiyon Geçmişi ─────────────────────── */}
          {allVersions.length > 0 && (
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <button
                className="flex items-center gap-2 text-xs w-full mb-3 vt-hover"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setShowVersions((p) => !p)}
              >
                <History className="w-3.5 h-3.5" />
                <span className="font-medium">Kayıt Versiyonları</span>
                <span style={{ color: 'var(--text-muted)' }}>({allVersions.length})</span>
                <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>
                  {showVersions
                    ? <ChevronUp className="w-3.5 h-3.5" />
                    : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>
              {showVersions && (
                <div className="space-y-3">
                  {(localTask.lines ?? [])
                    .filter((l) => (l.versions ?? []).length > 0)
                    .map((l) => (
                      <div key={l.id}>
                        <p className="text-[10px] font-medium mb-1 uppercase tracking-wider"
                          style={{ color: 'var(--text-muted)' }}>
                          Satır #{l.lineNumber}
                          {l.translatedText ? ` — ${l.translatedText.slice(0, 40)}...` : ''}
                        </p>
                        <VersionHistory versions={l.versions ?? []} />
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── Replik (Line) Listesi ─────────────────── */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Replikler
              </h3>
              <span className="text-xs font-normal normal-case" style={{ color: 'var(--text-muted)' }}>
                ({displayLines.length}
                {displayLines.length !== stats.total ? ` / ${stats.total}` : ''})
              </span>
            </div>

            {(localTask.lines ?? []).length > 0 && (
              <div className="mb-4">
                <LineFilterBar
                  filter={lineFilter}
                  onChange={setLineFilter}
                  totalLines={stats.total}
                  filteredLines={displayLines.length}
                />
              </div>
            )}

            {(localTask.lines ?? []).length === 0 ? (
              <div className="text-center py-10">
                <Mic2 className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Bu görev için henüz ses yüklenmemiş.
                </p>
                {!canUpload && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    PM/Developer tarafından kaynak ses yüklendiğinde replikler görünecek.
                  </p>
                )}
              </div>
            ) : displayLines.length === 0 ? (
              <div className="text-center py-8">
                <Mic2 className="w-6 h-6 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Filtreye uyan replik yok.
                </p>
                <button
                  onClick={() => setLineFilter({ ...DEFAULT_LINE_FILTER })}
                  className="text-xs mt-1 underline vt-hover"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Filtreyi temizle
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {displayLines.map((line) => (
                  <RecordingLineRow
                    key={line.id}
                    line={line}
                    projectId={projectId}
                    characterId={characterId}
                    taskId={localTask.id}
                    canWrite={canWrite}
                    canUpload={canUpload}
                    userRole={userRole}
                    userId={userId}
                    artistId={artistId}
                    artistName={artistName}
                    onUploadDone={handleLineUploaded}
                    highlight={line.status === 'rejected' || line.status === 'retake'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Panel Footer ─────────────────────────── */}
        <div
          className="px-5 py-3 border-t shrink-0"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>
              {localTask.sourceFiles.length > 0
                ? `${localTask.sourceFiles.length} kaynak · `
                : ''}
              {localTask.recordedFiles.length > 0
                ? `${localTask.recordedFiles.length} kayıt · `
                : ''}
              {totalSize > 0
                ? `${formatFileSize(totalSize)} toplam`
                : 'Dosya yok'}
            </span>
            <span>
              {stats.total > 0
                ? `${stats.total} replik · ${uploadedCount} yüklendi`
                : 'Replik yok'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
