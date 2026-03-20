// ============================================================
// PROJECT DETAIL PAGE — Phase 15 (Final Demo)
// Uçtan uca akış: Cast görüntüleme, karakter ekleme/düzenleme/silme,
// sanatçı atama, toplu ses yükleme, görev detayı, replik takibi.
// ============================================================

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Mic2,
  User,
  FileAudio,
  Info,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { TopBar }               from '../components/layout/TopBar';
import { Card }                 from '../components/ui/Card';
import { Badge }                from '../components/ui/Badge';
import { Button }               from '../components/ui/Button';
import { EmptyState }           from '../components/ui/EmptyState';
import { FullPageSpinner }      from '../components/ui/Spinner';
import { ConfirmModal }         from '../components/ui/ConfirmModal';

import { AddCharacterModal }    from '../components/projects/AddCharacterModal';
import { EditCharacterModal }   from '../components/projects/EditCharacterModal';
import { AssignArtistModal }    from '../components/projects/AssignArtistModal';
import { CastCard }             from '../components/projects/CastCard';
import { CastListHeader }       from '../components/projects/CastListHeader';
import type { CastFilters }     from '../components/projects/CastListHeader';

import { BulkUploadModal }      from '../components/upload/BulkUploadModal';

import { TaskCard }             from '../components/tasks/TaskCard';
import { TaskDetailPanel }      from '../components/tasks/TaskDetailPanel';
import { TaskFilterBar }        from '../components/tasks/TaskFilterBar';

import { ProjectProgressHeader } from '../components/progress/ProjectProgressHeader';
import { CastSummaryPanel }     from '../components/dashboard/CastSummaryPanel';
import { computeProjectProgress } from '../services/progressService';
import { filterTasks, DEFAULT_TASK_FILTER } from '../services/filterService';

import { useProjects }          from '../context/ProjectContext';
import { useAuth }              from '../context/AuthContext';
import { usePermission, useRole } from '../hooks/usePermission';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  formatDate,
  formatRelativeDate,
} from '../utils/formatters';
import type { Character, Project, Task, TaskFilter } from '../types';

// ─── Types ────────────────────────────────────────────────────
type TabKey = 'cast' | 'tasks' | 'stats' | 'info';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'cast',  label: 'Cast & Karakterler', icon: <User className="w-3.5 h-3.5" /> },
  { key: 'tasks', label: 'Görev Durumları',    icon: <Mic2 className="w-3.5 h-3.5" /> },
  { key: 'stats', label: 'İstatistikler',       icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: 'info',  label: 'Proje Bilgisi',       icon: <Info className="w-3.5 h-3.5" /> },
];

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 0, high: 1, normal: 2, low: 3,
};

// ─── Component ────────────────────────────────────────────────
export function ProjectDetail() {
  const { id }         = useParams<{ id: string }>();
  const navigate       = useNavigate();
  const {
    getProject,
    deleteCharacter,
    refreshProjects,
    uploadRecording,
  }                    = useProjects();
  const canWrite       = usePermission('projects:write');
  const isArtist       = useRole('voice_artist');
  const { currentUser } = useAuth();

  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabKey>('cast');

  // ── Cast filter/sort state ─────────────────────────────────
  const [castFilters, setCastFilters] = useState<CastFilters>({
    search: '',
    priority: 'all',
    assignment: 'all',
    sort: 'order',
  });
  const [showCastFilters, setShowCastFilters] = useState(false);

  // ── Modal state ───────────────────────────────────────────
  const [addCharOpen,       setAddCharOpen]       = useState(false);
  const [editCharTarget,    setEditCharTarget]    = useState<Character | null>(null);
  const [deleteCharTarget,  setDeleteCharTarget]  = useState<string | null>(null);
  const [isDeletingChar,    setIsDeletingChar]    = useState(false);

  // Assign artist modal
  const [assignTarget, setAssignTarget] = useState<Character | null>(null);

  // Bulk upload modal
  const [uploadTarget, setUploadTarget] = useState<{ character: Character; task: Task } | null>(null);

  // Task detail panel
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);

  // ── Load project ──────────────────────────────────────────
  const loadProject = useCallback(() => {
    if (!id) return;
    const p = getProject(id);
    setProject(p ?? null);
  }, [id, getProject]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const handleCharacterAdded = useCallback(async () => {
    await refreshProjects();
    loadProject();
  }, [refreshProjects, loadProject]);

  const handleCharacterEdited = useCallback(async () => {
    await refreshProjects();
    loadProject();
  }, [refreshProjects, loadProject]);

  // ── Delete character ──────────────────────────────────────
  const handleDeleteChar = async () => {
    if (!deleteCharTarget || !id) return;
    setIsDeletingChar(true);
    await deleteCharacter(id, deleteCharTarget);
    setIsDeletingChar(false);
    setDeleteCharTarget(null);
    loadProject();
  };

  // ── Assign artist ─────────────────────────────────────────
  const handleAssignSuccess = useCallback(async (updated: Character) => {
    setAssignTarget(null);
    await refreshProjects();
    loadProject();
    // Eğer task panel açıksa ve task bu karaktere aitse, güncel task'ı bul
    if (selectedTask && selectedTask.characterId === updated.id) {
      const fresh = getProject(id ?? '')?.tasks.find((t) => t.id === selectedTask.id);
      if (fresh) setSelectedTask(fresh);
    }
  }, [refreshProjects, loadProject, selectedTask, getProject, id]);

  // ── Bulk upload success ───────────────────────────────────
  const handleUploadSuccess = useCallback(async () => {
    setUploadTarget(null);
    await refreshProjects();
    loadProject();
  }, [refreshProjects, loadProject]);

  // ── Loading / not found ───────────────────────────────────
  if (project === undefined) return <FullPageSpinner />;

  if (project === null) {
    return (
      <div className="flex flex-col h-full">
        <TopBar
          title="Proje Bulunamadı"
          actions={
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => navigate('/projects')}
            >
              Geri
            </Button>
          }
        />
        <EmptyState
          icon={<AlertCircle />}
          title="Proje bulunamadı"
          description="Aradığın proje mevcut değil veya silinmiş olabilir."
          action={
            <Button variant="secondary" onClick={() => navigate('/projects')}>
              Projelere Dön
            </Button>
          }
        />
      </div>
    );
  }

  // ── Derived stats ─────────────────────────────────────────
  const projectProgress = computeProjectProgress(project);
  const totalTasks      = project.tasks.length;
  const byStatus        = projectProgress.tasksByStatus;
  const doneCount       = (byStatus['qc_approved'] ?? 0) + (byStatus['mixed'] ?? 0) + (byStatus['final'] ?? 0);
  const progress        = projectProgress.progressPercent;
  const totalLines      = projectProgress.totalLines;

  const deleteCharTargetName = project.characters.find((c) => c.id === deleteCharTarget)?.name;

  // Cast → task helper
  const getTaskForChar = (char: Character) =>
    project.tasks.find((t) => t.id === char.taskId);

  return (
    <div className="flex flex-col h-full">
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <TopBar
        title={project.title}
        subtitle={project.clientName}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => navigate('/projects')}
            >
              Geri
            </Button>
            {canWrite && activeTab === 'cast' && (
              <Button
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setAddCharOpen(true)}
              >
                Karakter Ekle
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* ── Project Header Banner ────────────────────────── */}
        <div
          className="px-6 pt-5 pb-0 border-b border-slate-800"
          style={{ borderLeftColor: project.coverColor ?? '#6366f1', borderLeftWidth: 4 }}
        >
          <div className="flex items-center gap-4 flex-wrap mb-4">
            <Badge
              label={PROJECT_STATUS_LABELS[project.status]}
              className={PROJECT_STATUS_COLORS[project.status]}
            />
            <span className="text-slate-500 text-sm">
              Yönetici: <span className="text-slate-300">{project.managerName}</span>
            </span>
            {project.dueDate && (
              <span className="text-slate-500 text-sm">
                Teslim: <span className="text-slate-300">{formatDate(project.dueDate)}</span>
              </span>
            )}
            <span className="text-slate-500 text-sm">
              {project.characters.length} karakter · {totalTasks} görev
              {totalLines > 0 && ` · ${totalLines} replik`}
            </span>
          </div>

          {project.description && (
            <p className="text-slate-500 text-sm mb-4 max-w-2xl leading-relaxed">
              {project.description}
            </p>
          )}

          {(totalTasks > 0 || totalLines > 0) && (
            <ProjectProgressHeader progress={projectProgress} className="mb-4" />
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className="border-b border-slate-800 px-6">
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.key === 'cast' && project.characters.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === 'cast'
                      ? 'bg-indigo-600/30 text-indigo-300'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {project.characters.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab Content ──────────────────────────────────── */}
        <div className="p-6">

          {/* ════ CAST TAB ══════════════════════════════════ */}
          {activeTab === 'cast' && (
            <CastTab
              project={project}
              castFilters={castFilters}
              onCastFiltersChange={setCastFilters}
              showCastFilters={showCastFilters}
              onToggleCastFilters={() => setShowCastFilters((p) => !p)}
              canWrite={canWrite}
              onAddCharacter={() => setAddCharOpen(true)}
              onEditCharacter={setEditCharTarget}
              onDeleteCharacter={setDeleteCharTarget}
              onAssignArtist={(char) => setAssignTarget(char)}
              onUploadAudio={(char) => {
                const task = getTaskForChar(char);
                if (task) setUploadTarget({ character: char, task });
              }}
              getTaskForChar={getTaskForChar}
            />
          )}

          {/* ════ TASKS TAB ═════════════════════════════════ */}
          {activeTab === 'tasks' && (
            <TasksTab
              project={project}
              canWrite={canWrite}
              onAddCharacter={() => { setActiveTab('cast'); setAddCharOpen(true); }}
              onTaskClick={(task) => { setSelectedTask(task); setTaskPanelOpen(true); }}
              selectedTaskId={selectedTask?.id}
            />
          )}

          {/* ════ STATS TAB ═════════════════════════════════ */}
          {activeTab === 'stats' && (
            <StatsTab
              project={project}
              totalTasks={totalTasks}
              byStatus={byStatus}
              doneCount={doneCount}
              progress={progress}
              totalLines={totalLines}
            />
          )}

          {/* ════ INFO TAB ══════════════════════════════════ */}
          {activeTab === 'info' && (
            <InfoTab project={project} />
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}

      {/* Karakter Ekle */}
      <AddCharacterModal
        isOpen={addCharOpen}
        onClose={() => setAddCharOpen(false)}
        projectId={project.id}
        onSuccess={handleCharacterAdded}
      />

      {/* Karakter Düzenle */}
      {editCharTarget && (
        <EditCharacterModal
          isOpen={!!editCharTarget}
          onClose={() => setEditCharTarget(null)}
          projectId={project.id}
          character={editCharTarget}
          onSuccess={handleCharacterEdited}
        />
      )}

      {/* Karakter Sil */}
      <ConfirmModal
        isOpen={!!deleteCharTarget}
        onClose={() => setDeleteCharTarget(null)}
        onConfirm={handleDeleteChar}
        title="Karakteri Sil"
        description={
          deleteCharTargetName
            ? `"${deleteCharTargetName}" karakterini ve ilişkili kayıt görevini silmek istediğinden emin misin?`
            : 'Bu karakteri silmek istediğinden emin misin?'
        }
        confirmLabel="Evet, Sil"
        isLoading={isDeletingChar}
      />

      {/* Sanatçı Ata */}
      {assignTarget && (
        <AssignArtistModal
          isOpen={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          character={assignTarget}
          projectId={project.id}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Toplu Ses Yükle */}
      {uploadTarget && (
        <BulkUploadModal
          isOpen={!!uploadTarget}
          onClose={() => setUploadTarget(null)}
          projectId={project.id}
          projectTitle={project.title}
          character={uploadTarget.character}
          task={uploadTarget.task}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Task Detay Paneli */}
      <TaskDetailPanel
        task={selectedTask}
        isOpen={taskPanelOpen}
        onClose={() => { setTaskPanelOpen(false); setSelectedTask(null); }}
        canWrite={canWrite}
        canUpload={isArtist}
        userRole={currentUser?.role ?? 'voice_artist'}
        userId={currentUser?.id ?? ''}
        artistId={currentUser?.id ?? ''}
        artistName={currentUser?.name ?? ''}
        projectId={project?.id ?? ''}
        onUploadRecording={async (taskId, lineId, file, artistNote) => {
          if (!project) return;
          await uploadRecording(project.id, taskId, lineId, file, artistNote);
          loadProject();
          // Açık task'ı güncelle
          const fresh = getProject(project.id)?.tasks.find((t) => t.id === taskId);
          if (fresh) setSelectedTask(fresh);
        }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

// ─── CAST TAB ─────────────────────────────────────────────────
interface CastTabProps {
  project: Project;
  castFilters: CastFilters;
  onCastFiltersChange: (f: CastFilters) => void;
  showCastFilters: boolean;
  onToggleCastFilters: () => void;
  canWrite: boolean;
  onAddCharacter: () => void;
  onEditCharacter: (c: Character) => void;
  onDeleteCharacter: (id: string) => void;
  onAssignArtist: (c: Character) => void;
  onUploadAudio: (c: Character) => void;
  getTaskForChar: (c: Character) => Task | undefined;
}

function CastTab({
  project,
  castFilters,
  onCastFiltersChange,
  showCastFilters,
  onToggleCastFilters,
  canWrite,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onAssignArtist,
  onUploadAudio,
  getTaskForChar,
}: CastTabProps) {

  const filtered = useMemo(() => {
    let chars = [...project.characters];

    if (castFilters.search.trim()) {
      const q = castFilters.search.toLowerCase();
      chars = chars.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.assignedArtistName?.toLowerCase().includes(q)
      );
    }

    if (castFilters.priority !== 'all') {
      chars = chars.filter((c) => (c.priority ?? 'normal') === castFilters.priority);
    }

    if (castFilters.assignment === 'assigned') {
      chars = chars.filter((c) => !!c.assignedArtistId);
    } else if (castFilters.assignment === 'unassigned') {
      chars = chars.filter((c) => !c.assignedArtistId);
    }

    chars.sort((a, b) => {
      switch (castFilters.sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'tr');
        case 'priority':
          return (PRIORITY_WEIGHT[a.priority ?? 'normal']) - (PRIORITY_WEIGHT[b.priority ?? 'normal']);
        case 'progress': {
          const pA = (a.lineCount ?? 0) > 0 ? ((a.completedCount ?? 0) / (a.lineCount ?? 1)) : -1;
          const pB = (b.lineCount ?? 0) > 0 ? ((b.completedCount ?? 0) / (b.lineCount ?? 1)) : -1;
          return pB - pA;
        }
        default:
          return (a.order ?? 999) - (b.order ?? 999);
      }
    });

    return chars;
  }, [project.characters, castFilters]);

  return (
    <div className="space-y-5">
      <CastListHeader
        characters={project.characters}
        tasks={project.tasks}
        filters={castFilters}
        onFiltersChange={onCastFiltersChange}
        canWrite={canWrite}
        onAddCharacter={onAddCharacter}
        showFilters={showCastFilters}
        onToggleFilters={onToggleCastFilters}
      />

      {project.characters.length === 0 ? (
        <EmptyState
          icon={<User />}
          title="Henüz karakter eklenmemiş"
          description="Projeye karakter eklemek için 'Karakter Ekle' butonuna tıkla."
          action={
            canWrite ? (
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={onAddCharacter}>
                İlk Karakteri Ekle
              </Button>
            ) : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<User />}
          title="Filtre sonucu boş"
          description="Arama veya filtre kriterlerine uyan karakter bulunamadı."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((char) => {
            const task = getTaskForChar(char);
            return (
              <CastCard
                key={char.id}
                character={char}
                task={task}
                project={project}
                canWrite={canWrite}
                onEdit={onEditCharacter}
                onDelete={onDeleteCharacter}
                onAssign={onAssignArtist}
                onUpload={canWrite ? onUploadAudio : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TASKS TAB ────────────────────────────────────────────────
function TasksTab({
  project,
  canWrite,
  onAddCharacter,
  onTaskClick,
  selectedTaskId,
}: {
  project: Project;
  canWrite: boolean;
  onAddCharacter: () => void;
  onTaskClick: (task: Task) => void;
  selectedTaskId?: string | null;
}) {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>({ ...DEFAULT_TASK_FILTER });
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(
    () => filterTasks(project.tasks, taskFilter),
    [project.tasks, taskFilter]
  );

  const totalLines   = useMemo(() => project.tasks.reduce((s, t) => s + t.lines.length, 0), [project.tasks]);
  const approvedLines = useMemo(() => project.tasks.reduce((s, t) => s + t.lines.filter((l) => l.status === 'approved').length, 0), [project.tasks]);
  const pendingLines  = useMemo(() => project.tasks.reduce((s, t) => s + t.lines.filter((l) => l.status === 'pending').length, 0), [project.tasks]);

  if (project.tasks.length === 0) {
    return (
      <EmptyState
        icon={<Mic2 />}
        title="Henüz görev yok"
        description="Projeye karakter eklendikçe görevler otomatik oluşturulacak."
        action={
          canWrite ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={onAddCharacter}>
              Karakter Ekle
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Özet istatistikler */}
      <div className="flex flex-wrap gap-4 pb-1">
        {[
          { label: 'Görev',     value: project.tasks.length, color: 'text-slate-300'  },
          { label: 'Replik',    value: totalLines,           color: 'text-blue-400'   },
          { label: 'Onaylanan', value: approvedLines,        color: 'text-emerald-400' },
          ...(pendingLines > 0 ? [{ label: 'Bekliyor', value: pendingLines, color: 'text-amber-400' }] : []),
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-sm">
            <span className={`font-bold text-lg leading-none ${s.color}`}>{s.value}</span>
            <span className="text-slate-600 text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      <TaskFilterBar
        filter={taskFilter}
        onChange={setTaskFilter}
        totalCount={project.tasks.length}
        filteredCount={filtered.length}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((p) => !p)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Mic2 />}
          title="Filtre sonucu boş"
          description="Arama veya filtre kriterlerine uyan görev bulunamadı."
          action={
            <Button variant="ghost" size="sm" onClick={() => setTaskFilter({ ...DEFAULT_TASK_FILTER })}>
              Filtreleri Temizle
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 flex items-center gap-1">
            <FileAudio className="w-3 h-3" />
            Detaylar için bir göreve tıkla · {filtered.length} görev gösteriliyor
          </p>
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              isSelected={selectedTaskId === task.id}
              searchQuery={taskFilter.search}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STATS TAB ────────────────────────────────────────────────
function StatsTab({
  project,
  totalTasks,
  byStatus,
  doneCount,
  progress,
  totalLines,
}: {
  project: Project;
  totalTasks: number;
  byStatus: Record<string, number>;
  doneCount: number;
  progress: number;
  totalLines: number;
}) {
  if (project.characters.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 />}
        title="Henüz istatistik yok"
        description="Projeye karakter ve replik eklenince istatistikler burada görüntülenecek."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Cast bazlı özet */}
      <CastSummaryPanel project={project} />

      {/* Görev durum dağılımı */}
      {totalTasks > 0 && (
        <Card>
          <div className="p-5">
            <h3 className="text-slate-200 font-semibold text-sm mb-4">Görev Durum Dağılımı</h3>

            {/* Conic progress */}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="18" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="#6366f1" strokeWidth="18"
                    strokeDasharray={`${progress * 2.513} 251.3`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-100">{progress}%</span>
                  <span className="text-[10px] text-slate-500">tamamlandı</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-2 min-w-[180px]">
                {Object.entries(byStatus).map(([status, count]) => (
                  count > 0 && (
                    <div key={status} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${TASK_STATUS_COLORS[status as keyof typeof TASK_STATUS_COLORS]?.replace('text-', 'bg-').split(' ')[0] ?? 'bg-slate-500'}`} />
                        <span className="text-slate-400 text-xs">{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</span>
                      </div>
                      <span className="text-slate-200 text-xs font-semibold">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Özet satır */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: 'Toplam Görev',  value: totalTasks,  color: 'text-slate-300' },
                { label: 'Tamamlanan',    value: doneCount,   color: 'text-emerald-400' },
                { label: 'Toplam Replik', value: totalLines,  color: 'text-indigo-400' },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/40 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── INFO TAB ─────────────────────────────────────────────────
function InfoTab({ project }: { project: Project }) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'Proje Adı',    value: project.title },
    { label: 'Müşteri',      value: project.clientName },
    { label: 'Yönetici',     value: project.managerName },
    { label: 'Durum',        value: PROJECT_STATUS_LABELS[project.status] },
    { label: 'Teslim Tarihi', value: project.dueDate ? formatDate(project.dueDate) : '—' },
    { label: 'Oluşturulma',  value: formatRelativeDate(project.createdAt) },
    { label: 'Son Güncelleme', value: formatRelativeDate(project.updatedAt) },
  ];

  return (
    <div className="max-w-xl space-y-4">
      <Card>
        <div className="p-5 space-y-4">
          <h3 className="text-slate-200 font-semibold text-sm">Proje Bilgileri</h3>
          <dl className="space-y-3">
            {fields.map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <dt className="text-slate-500 text-xs w-32 shrink-0 pt-0.5">{label}</dt>
                <dd className="text-slate-300 text-sm font-medium">{value ?? '—'}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      {project.description && (
        <Card>
          <div className="p-5">
            <h3 className="text-slate-200 font-semibold text-sm mb-3">Açıklama</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{project.description}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
