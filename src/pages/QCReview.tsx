// ============================================================
// QC REVIEW PAGE
// ============================================================

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircle, XCircle, Search, Download,
  FileAudio, Mic2, X, SlidersHorizontal, AlertCircle,
} from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import type { Project, RecordingLine, QCStatus } from '../types';

interface QCRow {
  id: string;
  projectId: string;
  projectTitle: string;
  taskId: string;
  characterName: string;
  lineId: string;
  lineNumber: number;
  originalText?: string;
  translatedText?: string;
  timecode?: string;
  artistId: string;
  artistName: string;
  sourceFile?: RecordingLine['sourceFile'];
  recordedFile?: RecordingLine['recordedFile'];
  qcStatus: QCStatus;
  qcNote?: string;
  reviewedByName?: string;
  submittedAt: string;
  retakeCount: number;
}

function buildQCRows(projects: Project[]): QCRow[] {
  const rows: QCRow[] = [];

  for (const project of projects) {
    for (const task of project.tasks ?? []) {
      for (const line of task.lines ?? []) {
        if (line.status === 'pending') continue;

        const qcStatus: QCStatus =
          line.status === 'approved'
            ? 'approved'
            : line.status === 'rejected' || line.status === 'retake'
              ? 'revision_requested'
              : 'pending';

        rows.push({
          id: `qc-${line.id}`,
          projectId: project.id,
          projectTitle: project.title,
          taskId: task.id,
          characterName: task.characterName,
          lineId: line.id,
          lineNumber: line.lineNumber,
          originalText: line.originalText,
          translatedText: line.translatedText,
          timecode: line.timecode,
          artistId: task.assignedTo ?? '',
          artistName: task.assignedArtistName ?? 'Atanmamış',
          sourceFile: line.sourceFile,
          recordedFile: line.recordedFile,
          qcStatus,
          qcNote: line.directorNote,
          submittedAt: line.updatedAt,
          retakeCount: line.retakeCount ?? 0,
        });
      }
    }
  }

  return rows.sort((a, b) => {
    const order: Record<QCStatus, number> = { pending: 0, revision_requested: 1, approved: 2 };
    if (order[a.qcStatus] !== order[b.qcStatus]) return order[a.qcStatus] - order[b.qcStatus];
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit',
  });
}
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_CONFIG: Record<QCStatus, { label: string }> = {
  pending:              { label: 'QC Bekliyor' },
  approved:             { label: 'Onaylandı' },
  revision_requested:   { label: 'Revize İstendi' },
};

function StatusBadge({ status }: { status: QCStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: 'var(--bg-elevated)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background:
            status === 'approved'
              ? 'var(--text-primary)'
              : status === 'revision_requested'
              ? 'var(--text-secondary)'
              : 'var(--text-muted)',
        }}
      />
      {STATUS_CONFIG[status].label}
    </span>
  );
}

interface ReviewModalProps {
  row: QCRow;
  onClose: () => void;
  onApprove: (note: string) => void;
  onRevision: (note: string) => void;
  isSubmitting: boolean;
}

function ReviewModal({ row, onClose, onApprove, onRevision, isSubmitting }: ReviewModalProps) {
  const [note, setNote] = useState(row.qcNote ?? '');
  const [action, setAction] = useState<'approve' | 'revision' | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fileUrl = row.recordedFile?.url ?? row.sourceFile?.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-base)' }}>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {row.characterName} · Satır #{row.lineNumber}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {row.projectTitle} · {row.artistName}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Script */}
          {(row.originalText || row.translatedText) && (
            <div className="space-y-2">
              {row.originalText && (
                <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Orijinal</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{row.originalText}</p>
                </div>
              )}
              {row.translatedText && (
                <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Çeviri</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{row.translatedText}</p>
                </div>
              )}
            </div>
          )}

          {/* Audio player */}
          {fileUrl && (
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {row.recordedFile ? 'Kayıt' : 'Kaynak Ses'}
              </p>
              <audio ref={audioRef} controls src={fileUrl} className="w-full h-10" />
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{row.recordedFile?.fileName ?? row.sourceFile?.fileName}</span>
                {(row.recordedFile?.fileSize ?? row.sourceFile?.fileSize) && (
                  <span>{fmtBytes(row.recordedFile?.fileSize ?? row.sourceFile?.fileSize ?? 0)}</span>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              QC Notu (opsiyonel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Yönetmen notu ekle…"
              rows={3}
              className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-base)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setAction('revision'); onRevision(note); }}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-base)', color: 'var(--text-secondary)' }}
            >
              <XCircle size={16} />
              Revize İste
            </button>
            <button
              onClick={() => { setAction('approve'); onApprove(note); }}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
            >
              <CheckCircle size={16} />
              Onayla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QCReview() {
  const { projects, applyQCDecision, isLoading } = useProjects();
  const { currentUser } = useAuth();
  const { notify } = useNotifications();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QCStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [reviewRow, setReviewRow] = useState<QCRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRows = useMemo(() => buildQCRows(projects), [projects]);

  const projectOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; title: string }[] = [];
    for (const r of allRows) {
      if (!seen.has(r.projectId)) {
        seen.add(r.projectId);
        opts.push({ id: r.projectId, title: r.projectTitle });
      }
    }
    return opts;
  }, [allRows]);

  const filtered = useMemo(() => {
    let rows = allRows;
    if (statusFilter !== 'all') rows = rows.filter((r) => r.qcStatus === statusFilter);
    if (projectFilter !== 'all') rows = rows.filter((r) => r.projectId === projectFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.characterName.toLowerCase().includes(q) ||
          r.artistName.toLowerCase().includes(q) ||
          r.originalText?.toLowerCase().includes(q) ||
          r.translatedText?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [allRows, statusFilter, projectFilter, search]);

  const counts = useMemo(() => ({
    pending:   allRows.filter((r) => r.qcStatus === 'pending').length,
    approved:  allRows.filter((r) => r.qcStatus === 'approved').length,
    revision:  allRows.filter((r) => r.qcStatus === 'revision_requested').length,
  }), [allRows]);

  const handleApprove = useCallback(async (note: string) => {
    if (!reviewRow || !currentUser) return;
    setIsSubmitting(true);
    try {
      await applyQCDecision(
        reviewRow.projectId,
        reviewRow.taskId,
        reviewRow.lineId,
        'approved',
        note,
        currentUser.name
      );
      notify({
        type: 'qc_approved',
        title: 'Kayıt Onaylandı',
        body: `${reviewRow.characterName} – Satır #${reviewRow.lineNumber} onaylandı.`,
        targetRole: 'voice_artist',
        meta: { projectId: reviewRow.projectId },
      });
      setReviewRow(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [reviewRow, currentUser, applyQCDecision, notify]);

  const handleRevision = useCallback(async (note: string) => {
    if (!reviewRow || !currentUser) return;
    setIsSubmitting(true);
    try {
      await applyQCDecision(
        reviewRow.projectId,
        reviewRow.taskId,
        reviewRow.lineId,
        'revision_requested',
        note,
        currentUser.name
      );
      notify({
        type: 'qc_rejected',
        title: 'Revize İstendi',
        body: `${reviewRow.characterName} – Satır #${reviewRow.lineNumber} için revize istendi.`,
        targetRole: 'voice_artist',
        meta: { projectId: reviewRow.projectId },
      });
      setReviewRow(null);
    } finally {
      setIsSubmitting(false);
    }
  }, [reviewRow, currentUser, applyQCDecision, notify]);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="QC İnceleme"
        subtitle={`${counts.pending} bekliyor · ${counts.approved} onaylandı · ${counts.revision} revize`}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara…"
                className="pl-8 pr-3 py-1.5 text-sm rounded-xl outline-none w-44"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-base)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl transition-colors"
              style={{
                background: showFilters ? 'var(--bg-elevated)' : 'transparent',
                border: '1px solid var(--border-base)',
                color: 'var(--text-secondary)',
              }}
            >
              <SlidersHorizontal size={13} />
              Filtre
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'QC Bekliyor', value: counts.pending, status: 'pending' as QCStatus },
            { label: 'Onaylandı',   value: counts.approved, status: 'approved' as QCStatus },
            { label: 'Revize',      value: counts.revision, status: 'revision_requested' as QCStatus },
          ].map((s) => (
            <button
              key={s.status}
              onClick={() => setStatusFilter(statusFilter === s.status ? 'all' : s.status)}
              className="flex flex-col items-start px-4 py-3 rounded-xl text-left transition-colors"
              style={{
                background: statusFilter === s.status ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                border: `1px solid ${statusFilter === s.status ? 'var(--border-strong)' : 'var(--border-base)'}`,
              }}
            >
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</span>
              <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="text-sm rounded-xl px-3 py-1.5 outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-base)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">Tüm Projeler</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {(['all', 'pending', 'approved', 'revision_requested'] as (QCStatus | 'all')[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  background: statusFilter === s ? 'var(--text-primary)' : 'var(--bg-elevated)',
                  color: statusFilter === s ? 'var(--bg-base)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-base)',
                }}
              >
                {s === 'all' ? 'Tümü' : s === 'pending' ? 'Bekliyor' : s === 'approved' ? 'Onaylandı' : 'Revize'}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle size={32} style={{ color: 'var(--text-muted)' }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-primary)' }}>Kayıt bulunamadı</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Filtrelerinizi değiştirin veya sanatçı yüklemesi bekleyin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((row) => (
              <div
                key={row.id}
                onClick={() => setReviewRow(row)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {row.characterName}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      #{row.lineNumber}
                    </span>
                    {row.retakeCount > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {row.retakeCount}. tekrar
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {row.projectTitle}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {row.artistName}
                    </span>
                  </div>
                  {row.originalText && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {row.originalText}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {(row.recordedFile || row.sourceFile) && (
                    <FileAudio size={14} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <StatusBadge status={row.qcStatus} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {fmtDate(row.submittedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewRow && (
        <ReviewModal
          row={reviewRow}
          onClose={() => setReviewRow(null)}
          onApprove={handleApprove}
          onRevision={handleRevision}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
