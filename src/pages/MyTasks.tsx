// ============================================================
// MY TASKS PAGE
// Seslendirme sanatçısının kendine atanmış görevleri.
// myTasks artık useProjects().projects'ten useMemo ile
// türetiliyor → QC kararları anında bu sayfaya yansır.
// ============================================================

import { useState, useCallback, useMemo } from 'react';
import {
  Mic2, Upload, Download, CheckCircle2, AlertTriangle,
  RefreshCw, FileAudio, Search, Filter, ChevronUp, ChevronDown, Clock,
} from 'lucide-react';
import { TopBar }           from '../components/layout/TopBar';
import { Card }             from '../components/ui/Card';
import { Badge }            from '../components/ui/Badge';
import { Button }           from '../components/ui/Button';
import { EmptyState }       from '../components/ui/EmptyState';
import { TaskDetailPanel }  from '../components/tasks/TaskDetailPanel';
import { useProjects }      from '../context/ProjectContext';
import { useAuth }          from '../context/AuthContext';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  formatRelativeDate,
} from '../utils/formatters';
import type { MyTask, AudioFile, TaskStatus } from '../types';

// ─── Filtre tipleri ───────────────────────────────────────────
type StatusFilter = TaskStatus | 'all';
type SortKey = 'priority' | 'updated' | 'project' | 'status';

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',         label: 'Tümü' },
  { value: 'pending',     label: 'Bekliyor' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'uploaded',    label: 'Yüklendi' },
  { value: 'qc_approved', label: 'Onaylandı' },
  { value: 'qc_rejected', label: 'Reddedildi' },
];

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 0, high: 1, normal: 2, low: 3,
};
const STATUS_ORDER: Record<TaskStatus, number> = {
  qc_rejected: 0, pending: 1, in_progress: 2,
  uploaded: 3, qc_approved: 4, mixed: 5, final: 6,
};

// ─── projects'ten MyTask listesi türetme ─────────────────────

function deriveMyTasks(
  projects: ReturnType<typeof useProjects>['projects'],
  artistId: string
): MyTask[] {
  const result: MyTask[] = [];
  for (const project of projects) {
    for (const task of project.tasks ?? []) {
      if (task.assignedTo !== artistId) continue;
      const character = project.characters.find((c) => c.id === task.characterId);
      result.push({
        ...task,
        projectTitle: project.title,
        projectColor: project.coverColor ?? '#6B7280',
        clientName: project.clientName,
        characterDescription: character?.description,
        voiceNotes: character?.voiceNotes,
        characterGender: character?.gender,
        characterPriority: character?.priority,
      });
    }
  }
  return result.sort((a, b) => {
    const pa = PRIORITY_WEIGHT[a.characterPriority ?? 'normal'] ?? 2;
    const pb = PRIORITY_WEIGHT[b.characterPriority ?? 'normal'] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

// ─── Özet pill ───────────────────────────────────────────────

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
      <span className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

// ─── QC bildirim bandı (sanatçıya QC kararlarını göster) ─────

function QCNoticeBand({
  approvedCount,
  rejectedCount,
  onShowRejected,
}: {
  approvedCount: number;
  rejectedCount: number;
  onShowRejected: () => void;
}) {
  if (rejectedCount === 0 && approvedCount === 0) return null;
  return (
    <div className="space-y-2">
      {rejectedCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--text-primary)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {rejectedCount} görev reddedildi
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              QC yönetmenin notlarını oku ve kaydı tekrar yükle.
            </p>
          </div>
          <button
            onClick={onShowRejected}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors vt-hover shrink-0"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Göster
          </button>
        </div>
      )}
      {approvedCount > 0 && rejectedCount === 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--text-primary)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {approvedCount} görev onaylandı 🎉
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Harika iş çıkardın.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Görev Kartı ──────────────────────────────────────────────

function MyTaskCard({ task, onClick }: { task: MyTask; onClick: () => void }) {
  const uploadedLines = (task.lines ?? []).filter(
    (l) => l.status === 'recorded' || l.status === 'approved'
  ).length;
  const approvedLines = (task.lines ?? []).filter(
    (l) => l.status === 'approved'
  ).length;
  const rejectedLines = (task.lines ?? []).filter(
    (l) => l.status === 'rejected' || l.status === 'retake'
  ).length;
  const totalLines = task.lines?.length ?? 0;
  const uploadPct = totalLines > 0 ? Math.round((uploadedLines / totalLines) * 100) : 0;
  const hasSourceFiles =
    (task.sourceFiles?.length ?? 0) > 0 || (task.lines ?? []).some((l) => l.sourceFile);
  const pendingCount = (task.lines ?? []).filter((l) => l.status === 'pending').length;

  // QC durumu — sanatçıya net göster
  const isApproved = task.status === 'qc_approved';
  const isRejected = task.status === 'qc_rejected';

  return (
    <Card hoverable className="cursor-pointer group transition-all" onClick={onClick}>
      {/* Proje renk şeridi */}
      <div
        className="h-0.5 rounded-t-xl -mt-4 -mx-4 mb-4"
        style={{ backgroundColor: 'var(--border-strong)' }}
      />

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Proje adı */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-md"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {task.projectTitle}
            </span>
            {task.clientName && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {task.clientName}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-base mb-1 group-hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-primary)' }}>
            {task.characterName}
          </h3>

          {/* Durum badge'leri */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              label={TASK_STATUS_LABELS[task.status]}
              className={TASK_STATUS_COLORS[task.status]}
            />
            {isRejected && rejectedLines > 0 && (
              <span
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                <RefreshCw className="w-2.5 h-2.5" />
                {rejectedLines} retake
              </span>
            )}
          </div>

          {/* Yönetmen notu / ses notu */}
          {task.voiceNotes && (
            <p className="text-xs mt-2 italic truncate" style={{ color: 'var(--text-muted)' }}>
              &quot;{task.voiceNotes}&quot;
            </p>
          )}
        </div>

        {/* Sağ: istatistikler */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-xs">
            {hasSourceFiles ? (
              <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Download className="w-3 h-3" />
                İndirilebilir
              </span>
            ) : (
              <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <FileAudio className="w-3 h-3" />
                Dosya bekleniyor
              </span>
            )}
          </div>

          {totalLines > 0 ? (
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isApproved ? approvedLines : uploadedLines}
                </span>
                /{totalLines}{' '}
                {isApproved ? 'onaylandı' : 'yüklendi'}
              </p>
              {pendingCount > 0 && !isApproved && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {pendingCount} bekliyor
                </p>
              )}
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {task.lineCount} replik
            </span>
          )}

          <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-2.5 h-2.5" />
            {formatRelativeDate(task.updatedAt)}
          </span>
        </div>
      </div>

      {/* İlerleme çubuğu */}
      {totalLines > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isApproved ? 'Onay İlerlemesi' : 'Yükleme İlerlemesi'}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isApproved
                ? Math.round((approvedLines / totalLines) * 100)
                : uploadPct}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${isApproved ? Math.round((approvedLines / totalLines) * 100) : uploadPct}%`,
                background: 'var(--text-primary)',
              }}
            />
          </div>
          {/* Satır düzeyinde detay */}
          {(approvedLines > 0 || rejectedLines > 0) && (
            <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {approvedLines > 0 && (
                <span className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--text-primary)' }}
                  />
                  {approvedLines} onaylı
                </span>
              )}
              {rejectedLines > 0 && (
                <span className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--text-secondary)' }}
                  />
                  {rejectedLines} retake
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────

export function MyTasks() {
  const { currentUser } = useAuth();
  const { projects, uploadRecording } = useProjects();

  // ── Merkezi state'ten türetilmiş görev listesi ─────────────
  // projects değiştiğinde (QC kararı, upload, vb.) otomatik güncellenir
  const myTasks = useMemo(
    () => deriveMyTasks(projects, currentUser?.id ?? ''),
    [projects, currentUser?.id]
  );

  // Filtre state'leri
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey]           = useState<SortKey>('priority');
  const [showFilters, setShowFilters]   = useState(false);

  // Detail panel
  const [selectedTask, setSelectedTask] = useState<MyTask | null>(null);
  const [panelOpen, setPanelOpen]       = useState(false);

  // selectedTask'ı da güncel tut — QC kararı panel açıkken gelirse
  const currentSelectedTask = useMemo(() => {
    if (!selectedTask) return null;
    return myTasks.find((t) => t.id === selectedTask.id) ?? selectedTask;
  }, [selectedTask, myTasks]);

  // ── Upload callback ───────────────────────────────────────
  const handleUploadRecording = useCallback(
    async (taskId: string, lineId: string, file: AudioFile, artistNote?: string) => {
      if (!currentUser) return;
      const task = myTasks.find((t) => t.id === taskId);
      if (!task) return;
      // uploadRecording → ProjectContext.setProjects → myTasks otomatik güncellenir
      await uploadRecording(task.projectId, taskId, lineId, file, artistNote);
    },
    [currentUser, myTasks, uploadRecording]
  );

  // ── Filtrele + Sırala ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...myTasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.characterName.toLowerCase().includes(q) ||
          t.projectTitle.toLowerCase().includes(q) ||
          (t.clientName ?? '').toLowerCase().includes(q) ||
          (t.voiceNotes ?? '').toLowerCase().includes(q) ||
          (t.lines ?? []).some(
            (l) =>
              (l.originalText ?? '').toLowerCase().includes(q) ||
              (l.translatedText ?? '').toLowerCase().includes(q) ||
              String(l.lineNumber).includes(q)
          )
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case 'priority': {
          const pa = PRIORITY_WEIGHT[a.characterPriority ?? 'normal'] ?? 2;
          const pb = PRIORITY_WEIGHT[b.characterPriority ?? 'normal'] ?? 2;
          return pa !== pb ? pa - pb : 0;
        }
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'project':
          return a.projectTitle.localeCompare(b.projectTitle, 'tr');
        case 'status':
          return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        default:
          return 0;
      }
    });
    return list;
  }, [myTasks, search, statusFilter, sortKey]);

  // ── İstatistikler ─────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    myTasks.length,
    pending:  myTasks.filter((t) => t.status === 'pending').length,
    active:   myTasks.filter((t) => t.status === 'in_progress').length,
    uploaded: myTasks.filter((t) => t.status === 'uploaded').length,
    approved: myTasks.filter((t) => t.status === 'qc_approved').length,
    rejected: myTasks.filter((t) => t.status === 'qc_rejected').length,
    totalLines: myTasks.reduce((s, t) => s + (t.lines?.length ?? 0), 0),
    uploadedLines: myTasks.reduce(
      (s, t) => s + (t.lines ?? []).filter(
        (l) => l.status === 'recorded' || l.status === 'approved'
      ).length, 0
    ),
    approvedLines: myTasks.reduce(
      (s, t) => s + (t.lines ?? []).filter((l) => l.status === 'approved').length, 0
    ),
  }), [myTasks]);

  const activeFilterCount =
    (search.trim() ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Görevlerim"
        subtitle={`${stats.total} görev · ${stats.totalLines} replik`}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">

          {/* ── Özet istatistikler ──────────────────────────── */}
          {myTasks.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <SummaryPill label="Toplam Görev" value={stats.total} />
              {stats.pending > 0 && <SummaryPill label="Bekliyor"      value={stats.pending} />}
              {stats.active  > 0 && <SummaryPill label="Devam Ediyor"  value={stats.active} />}
              {stats.uploaded > 0 && <SummaryPill label="QC Bekliyor"  value={stats.uploaded} />}
              {stats.approved > 0 && <SummaryPill label="Onaylandı"    value={stats.approved} />}
              {stats.rejected > 0 && <SummaryPill label="Reddedildi"   value={stats.rejected} />}
              {stats.totalLines > 0 && (
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl ml-auto"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                >
                  <Upload className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      {stats.approvedLines > 0
                        ? `${stats.approvedLines}/${stats.totalLines}`
                        : `${stats.uploadedLines}/${stats.totalLines}`}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {stats.approvedLines > 0 ? 'replik onaylandı' : 'replik yüklendi'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── QC Bildirim Bandı ────────────────────────────── */}
          <QCNoticeBand
            approvedCount={stats.approved}
            rejectedCount={stats.rejected}
            onShowRejected={() => setStatusFilter('qc_rejected')}
          />

          {/* ── Arama + Filtreler ─────────────────────────── */}
          {myTasks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Karakter, proje, replik ara..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-colors"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters((p) => !p)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors relative vt-hover"
                  style={{
                    background: showFilters || activeFilterCount > 0
                      ? 'var(--bg-active)' : 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtrele</span>
                  {activeFilterCount > 0 && (
                    <span
                      className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--text-primary)', color: 'var(--accent-text)' }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                  {showFilters
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />}
                </button>

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setSearch(''); setStatusFilter('all'); }}
                    className="text-xs transition-colors vt-hover"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Temizle
                  </button>
                )}
              </div>

              {showFilters && (
                <div
                  className="flex flex-wrap gap-4 p-4 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                      Durum
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_FILTER_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStatusFilter(opt.value)}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: statusFilter === opt.value
                              ? 'var(--text-primary)' : 'var(--bg-base)',
                            color: statusFilter === opt.value
                              ? 'var(--accent-text)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid var(--border)' }} />

                  <div>
                    <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                      Sıralama
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        { value: 'priority' as SortKey, label: 'Öncelik' },
                        { value: 'updated'  as SortKey, label: 'Son Güncelleme' },
                        { value: 'project'  as SortKey, label: 'Proje' },
                        { value: 'status'   as SortKey, label: 'Durum' },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSortKey(opt.value)}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: sortKey === opt.value
                              ? 'var(--bg-active)' : 'var(--bg-base)',
                            color: sortKey === opt.value
                              ? 'var(--text-primary)' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Görev listesi ─────────────────────────────── */}
          {myTasks.length === 0 ? (
            <EmptyState
              icon={<Mic2 />}
              title="Henüz görevin yok"
              description="Sana atanmış kayıt görevi bulunmuyor. Proje yöneticisi bir karakter atadığında burada görünecek."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="Sonuç bulunamadı"
              description="Arama veya filtre kriterlerine uyan görev yok."
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSearch(''); setStatusFilter('all'); }}
                >
                  Filtreleri Temizle
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {filtered.length} görev gösteriliyor
                  {filtered.length !== myTasks.length && ` (${myTasks.length} toplam)`}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((task) => (
                  <MyTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => {
                      setSelectedTask(task);
                      setPanelOpen(true);
                    }}
                  />
                ))}
              </div>

              {/* Nasıl çalışır */}
              {stats.pending > 0 && (
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--bg-active)' }}
                    >
                      <Mic2 className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Nasıl çalışır?
                      </p>
                      <ol
                        className="text-xs mt-1.5 space-y-1 list-decimal list-inside"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <li>Göreve tıkla → Replik listesini gör</li>
                        <li>
                          <Download className="w-3 h-3 inline mr-1" />
                          Orijinal sesi indir, dinle
                        </li>
                        <li>
                          <Upload className="w-3 h-3 inline mr-1" />
                          Kendi kaydını yükle
                        </li>
                        <li>QC onayını bekle</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={currentSelectedTask}
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelectedTask(null);
        }}
        canWrite={false}
        canUpload={true}
        userRole={currentUser?.role ?? 'voice_artist'}
        userId={currentUser?.id ?? ''}
        artistId={currentUser?.id ?? ''}
        artistName={currentUser?.name ?? ''}
        projectId={currentSelectedTask?.projectId ?? ''}
        onUploadRecording={handleUploadRecording}
      />
    </div>
  );
}
