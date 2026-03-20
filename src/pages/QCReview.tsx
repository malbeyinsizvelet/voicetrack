// ============================================================
// QC REVIEW PAGE
// Tüm veri doğrudan useProjects()'ten türetilir.
// Kararlar applyQCDecision() ile merkezi state'e yazılır →
// MyTasks, ProjectDetail, Dashboard otomatik güncellenir.
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

// ── Türetilmiş QC satırı tipi ────────────────────────────────

interface QCRow {
  // Kimlik
  id: string;          // `qc-${lineId}`
  projectId: string;
  projectTitle: string;
  taskId: string;
  characterName: string;
  lineId: string;
  lineNumber: number;
  // İçerik
  originalText?: string;
  translatedText?: string;
  timecode?: string;
  // Sanatçı
  artistId: string;
  artistName: string;
  // Dosyalar
  sourceFile?: RecordingLine['sourceFile'];
  recordedFile?: RecordingLine['recordedFile'];
  // QC durumu (line.status'tan türetilir)
  qcStatus: QCStatus;
  qcNote?: string;
  reviewedByName?: string;
  submittedAt: string;
  // Navigasyon için
  retakeCount: number;
}

// ── Türetme fonksiyonu ────────────────────────────────────────

function buildQCRows(projects: Project[]): QCRow[] {
  const rows: QCRow[] = [];

  for (const project of projects) {
    for (const task of project.tasks ?? []) {
      for (const line of task.lines ?? []) {
        // Sadece kaydedilmiş veya karara bağlanmış satırlar
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

// ── Yardımcılar ───────────────────────────────────────────────

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
  pending:            { label: 'QC Bekliyor' },
  approved:           { label: 'Onaylandı' },
  revision_requested: { label: 'Revize İstendi' },
};

// ── StatusBadge ───────────────────────────────────────────────

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

// ── ReviewModal ───────────────────────────────────────────────

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
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit() {
    if (!action) return;
    if (action === 'revision' && !note.trim()) {
      alert('Revize notu zorunludur.');
      return;
    }
    if (action === 'approve') onApprove(note);
    else onRevision(note);
  }

  function mockDownload(label: string) {
    // Gerçek sistemde presigned URL ile indirilir
    alert(`"${label}" indiriliyor… (mock)`);
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-strong)' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              {row.projectTitle} · {row.characterName}
            </div>
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
              Satır #{row.lineNumber}
            </h2>
            {row.timecode && (
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                TC: {row.timecode}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={row.qcStatus} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors vt-hover"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Metin */}
          {(row.originalText || row.translatedText) && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              {row.originalText && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    Orijinal
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {row.originalText}
                  </p>
                </div>
              )}
              {row.translatedText && (
                <div
                  style={{
                    borderTop: row.originalText ? '1px solid var(--border)' : undefined,
                    paddingTop: row.originalText ? 12 : 0,
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    Türkçe
                  </div>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {row.translatedText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Dosyalar */}
          <div className="grid grid-cols-2 gap-3">
            {/* Orijinal */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileAudio className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Orijinal Ses
                </span>
              </div>
              {row.sourceFile ? (
                <div className="space-y-2">
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {row.sourceFile.fileName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {fmtBytes(row.sourceFile.fileSize)}
                  </div>
                  <button
                    onClick={() => mockDownload(row.sourceFile!.fileName)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors vt-hover w-full justify-center"
                    style={{
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Download className="w-3 h-3" />
                    İndir
                  </button>
                </div>
              ) : (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Yüklenmemiş</div>
              )}
            </div>

            {/* Kayıt alınan */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Mic2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Kayıt Alınan
                </span>
              </div>
              {row.recordedFile ? (
                <div className="space-y-2">
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {row.recordedFile.fileName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {fmtBytes(row.recordedFile.fileSize)}
                  </div>
                  <button
                    onClick={() => mockDownload(row.recordedFile!.fileName)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors w-full justify-center"
                    style={{
                      background: 'var(--text-primary)',
                      border: '1px solid var(--text-primary)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    <Download className="w-3 h-3" />
                    İndir
                  </button>
                </div>
              ) : (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Henüz yüklenmedi</div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>
              Sanatçı:{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{row.artistName}</span>
            </span>
            <span>
              Yüklenme:{' '}
              <span style={{ color: 'var(--text-secondary)' }}>
                {fmtDate(row.submittedAt)} {fmtTime(row.submittedAt)}
              </span>
            </span>
            {row.retakeCount > 0 && (
              <span>
                Retake:{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{row.retakeCount}×</span>
              </span>
            )}
            {row.reviewedByName && (
              <span>
                İnceleyen:{' '}
                <span style={{ color: 'var(--text-secondary)' }}>{row.reviewedByName}</span>
              </span>
            )}
          </div>

          {/* Not */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              İnceleme Notu{' '}
              {action === 'revision' && (
                <span style={{ color: 'var(--text-muted)' }}>(zorunlu)</span>
              )}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="QC notunuzu buraya yazın…"
              className="w-full rounded-xl text-sm resize-none px-3 py-2.5 outline-none transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Aksiyon seçimi */}
          <div className="flex gap-3">
            <button
              onClick={() => setAction(action === 'approve' ? null : 'approve')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: action === 'approve' ? 'var(--text-primary)' : 'var(--bg-elevated)',
                color: action === 'approve' ? 'var(--accent-text)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <CheckCircle className="w-4 h-4" />
              Onayla
            </button>
            <button
              onClick={() => setAction(action === 'revision' ? null : 'revision')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: action === 'revision' ? 'var(--bg-elevated)' : 'var(--bg-elevated)',
                color: action === 'revision' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: action === 'revision'
                  ? '1px solid var(--text-primary)'
                  : '1px solid var(--border)',
              }}
            >
              <XCircle className="w-4 h-4" />
              Revize İste
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm transition-colors vt-hover"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!action || isSubmitting}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: 'var(--text-primary)',
              color: 'var(--accent-text)',
            }}
          >
            {isSubmitting ? 'Kaydediliyor…' : action === 'approve' ? 'Onayla' : action === 'revision' ? 'Revize İste' : 'Aksiyon Seç'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tablo Satırı ─────────────────────────────────────────────

function ReviewRow({ row, onClick }: { row: QCRow; onClick: () => void }) {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer transition-colors vt-hover-row"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Proje / Karakter */}
      <td className="py-3.5 pl-4 pr-3">
        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {row.characterName}
        </div>
        <div className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
          {row.projectTitle}
        </div>
      </td>

      {/* Satır */}
      <td className="py-3.5 px-3 hidden md:table-cell">
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          #{row.lineNumber}
        </span>
        {row.timecode && (
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {row.timecode}
          </div>
        )}
      </td>

      {/* Sanatçı */}
      <td className="py-3.5 px-3 hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            {row.artistName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {row.artistName}
          </span>
        </div>
      </td>

      {/* Durum */}
      <td className="py-3.5 px-3">
        <StatusBadge status={row.qcStatus} />
      </td>

      {/* Dosyalar */}
      <td className="py-3.5 px-3 hidden sm:table-cell">
        <div className="flex gap-2">
          <span
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
            style={{
              background: row.sourceFile ? 'var(--bg-active)' : 'var(--bg-elevated)',
              color: row.sourceFile ? 'var(--text-secondary)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <FileAudio className="w-3 h-3" />
            {row.sourceFile ? 'Var' : 'Yok'}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
            style={{
              background: row.recordedFile ? 'var(--bg-active)' : 'var(--bg-elevated)',
              color: row.recordedFile ? 'var(--text-secondary)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <Mic2 className="w-3 h-3" />
            {row.recordedFile ? 'Var' : 'Yok'}
          </span>
        </div>
      </td>

      {/* Tarih */}
      <td className="py-3.5 pl-3 pr-4 hidden xl:table-cell">
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {fmtDate(row.submittedAt)}
        </div>
      </td>
    </tr>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────

type FilterTab = QCStatus | 'all';

export function QCReviewPage() {
  const { projects, applyQCDecision } = useProjects();
  const { currentUser }               = useAuth();
  const { notify }                    = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [artistFilter, setArtistFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRow, setSelectedRow] = useState<QCRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tüm QC satırlarını projects'ten türet — projects değişince otomatik güncellenir
  const allRows = useMemo(() => buildQCRows(projects), [projects]);

  // Aktif tab'a göre filtrele — selectedRow'u güncelle
  useEffect(() => {
    if (!selectedRow) return;
    const updated = allRows.find((r) => r.id === selectedRow.id);
    if (updated) setSelectedRow(updated);
  }, [allRows]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtre dropdown verileri
  const uniqueProjects = useMemo(() => {
    const seen = new Set<string>();
    return allRows.filter((r) => {
      if (seen.has(r.projectId)) return false;
      seen.add(r.projectId);
      return true;
    }).map((r) => ({ id: r.projectId, title: r.projectTitle }));
  }, [allRows]);

  const uniqueArtists = useMemo(() => {
    const seen = new Set<string>();
    return allRows.filter((r) => {
      if (seen.has(r.artistId)) return false;
      seen.add(r.artistId);
      return true;
    }).map((r) => ({ id: r.artistId, name: r.artistName }));
  }, [allRows]);

  // Uygulanan filtreler
  const filtered = useMemo(() => {
    let list = allRows;
    if (activeTab !== 'all') list = list.filter((r) => r.qcStatus === activeTab);
    if (projectFilter !== 'all') list = list.filter((r) => r.projectId === projectFilter);
    if (artistFilter !== 'all') list = list.filter((r) => r.artistId === artistFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.projectTitle.toLowerCase().includes(q) ||
          r.characterName.toLowerCase().includes(q) ||
          r.artistName.toLowerCase().includes(q) ||
          String(r.lineNumber).includes(q) ||
          (r.originalText?.toLowerCase() ?? '').includes(q) ||
          (r.translatedText?.toLowerCase() ?? '').includes(q)
      );
    }
    return list;
  }, [allRows, activeTab, projectFilter, artistFilter, search]);

  // Sayaçlar
  const counts: Record<FilterTab, number> = useMemo(() => ({
    all:                allRows.length,
    pending:            allRows.filter((r) => r.qcStatus === 'pending').length,
    approved:           allRows.filter((r) => r.qcStatus === 'approved').length,
    revision_requested: allRows.filter((r) => r.qcStatus === 'revision_requested').length,
  }), [allRows]);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',                label: 'Tümü' },
    { key: 'pending',            label: 'QC Bekliyor' },
    { key: 'approved',           label: 'Onaylananlar' },
    { key: 'revision_requested', label: 'Revize İstenenler' },
  ];

  // ── QC Aksiyonları (merkezi state'e yazar) ──────────────────

  const handleApprove = useCallback(async (note: string) => {
    if (!selectedRow) return;
    setIsSubmitting(true);
    try {
      await applyQCDecision(
        selectedRow.projectId,
        selectedRow.taskId,
        selectedRow.lineId,
        'approved',
        note,
        currentUser?.name ?? 'QC'
      );
      // Sanatçıya bildirim
      notify({
        type: 'qc_approved',
        title: 'Kaydınız Onaylandı',
        body: `${selectedRow.characterName} — Satır #${selectedRow.lineNumber} onaylandı.${note ? ` Not: ${note}` : ''}`,
        targetRole: 'voice_artist',
        meta: {
          projectId: selectedRow.projectId,
          projectName: selectedRow.projectTitle,
          characterName: selectedRow.characterName,
          lineNumber: selectedRow.lineNumber,
        },
      });
    } finally {
      setIsSubmitting(false);
      setSelectedRow(null);
    }
  }, [selectedRow, applyQCDecision, currentUser?.name, notify]);

  const handleRevision = useCallback(async (note: string) => {
    if (!selectedRow) return;
    setIsSubmitting(true);
    try {
      await applyQCDecision(
        selectedRow.projectId,
        selectedRow.taskId,
        selectedRow.lineId,
        'rejected',
        note,
        currentUser?.name ?? 'QC'
      );
      // Sanatçıya revize bildirimi
      notify({
        type: 'qc_rejected',
        title: 'Revize İstendi',
        body: `${selectedRow.characterName} — Satır #${selectedRow.lineNumber} için revize istendi.${note ? ` Not: ${note}` : ''}`,
        targetRole: 'voice_artist',
        meta: {
          projectId: selectedRow.projectId,
          projectName: selectedRow.projectTitle,
          characterName: selectedRow.characterName,
          lineNumber: selectedRow.lineNumber,
        },
      });
    } finally {
      setIsSubmitting(false);
      setSelectedRow(null);
    }
  }, [selectedRow, applyQCDecision, currentUser?.name, notify]);

  const activeFiltersCount =
    (projectFilter !== 'all' ? 1 : 0) + (artistFilter !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="QC İnceleme"
        subtitle={`${counts.pending} kayıt bekliyor · ${counts.approved} onaylandı`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Özet kartlar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Toplam',         value: counts.all },
            { label: 'QC Bekliyor',    value: counts.pending },
            { label: 'Onaylandı',      value: counts.approved },
            { label: 'Revize İstendi', value: counts.revision_requested },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {s.value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar + Tablo */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          {/* Tab bar */}
          <div
            className="flex items-center gap-1 px-4 pt-3 pb-0"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-t-lg transition-colors relative"
                style={{
                  color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: activeTab === tab.key ? 'var(--bg-elevated)' : 'transparent',
                  borderBottom: activeTab === tab.key
                    ? '2px solid var(--text-primary)'
                    : '2px solid transparent',
                }}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                      background: activeTab === tab.key ? 'var(--text-primary)' : 'var(--bg-active)',
                      color: activeTab === tab.key ? 'var(--accent-text)' : 'var(--text-secondary)',
                    }}
                  >
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Arama + Filtre satırı */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Proje, karakter, sanatçı veya satır ara…"
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors vt-hover relative"
              style={{
                background: showFilters || activeFiltersCount > 0
                  ? 'var(--bg-active)' : 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtrele
              {activeFiltersCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                  style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filtre paneli */}
          {showFilters && (
            <div
              className="flex flex-wrap items-center gap-3 px-4 py-3"
              style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
            >
              <div className="flex items-center gap-2">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Proje</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg outline-none"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="all">Tümü</option>
                  {uniqueProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Sanatçı</label>
                <select
                  value={artistFilter}
                  onChange={(e) => setArtistFilter(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg outline-none"
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="all">Tümü</option>
                  {uniqueArtists.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { setProjectFilter('all'); setArtistFilter('all'); }}
                  className="text-xs px-2.5 py-1.5 rounded-lg transition-colors vt-hover"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  Sıfırla
                </button>
              )}
            </div>
          )}

          {/* Tablo */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {search || activeFiltersCount > 0
                  ? 'Arama kriterlerine uyan kayıt bulunamadı.'
                  : activeTab === 'pending'
                    ? 'QC bekleyen kayıt yok.'
                    : 'Bu kategoride kayıt yok.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[
                      { label: 'Proje / Karakter', cls: 'pl-4 pr-3' },
                      { label: 'Satır',             cls: 'px-3 hidden md:table-cell' },
                      { label: 'Sanatçı',           cls: 'px-3 hidden lg:table-cell' },
                      { label: 'Durum',             cls: 'px-3' },
                      { label: 'Dosyalar',          cls: 'px-3 hidden sm:table-cell' },
                      { label: 'Tarih',             cls: 'pl-3 pr-4 hidden xl:table-cell' },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`py-2.5 text-left text-[11px] font-medium uppercase tracking-wider ${h.cls}`}
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <ReviewRow key={r.id} row={r} onClick={() => setSelectedRow(r)} />
                  ))}
                </tbody>
              </table>
              <div
                className="px-4 py-2.5 text-xs"
                style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
              >
                {filtered.length} kayıt gösteriliyor
              </div>
            </div>
          )}
        </div>
      </div>

      {/* İnceleme Modal */}
      {selectedRow && (
        <ReviewModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onApprove={handleApprove}
          onRevision={handleRevision}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
