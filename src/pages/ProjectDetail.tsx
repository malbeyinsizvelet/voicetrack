// ============================================================
// PROJECT DETAIL PAGE – Phase 15
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

type TabKey = 'cast' | 'tasks' | 'stats' | 'info';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'cast',  label: 'Cast & Karakterler', icon: <User className="w-3.5 h-3.5" /> },
  { key: 'tasks', label: 'Görev Durumları',    icon: <Mic2 className="w-3.5 h-3.5" /> },
  { key: 'stats', label: 'İstatistikler',      icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: 'info',  label: 'Proje Bilgisi',      icon: <Info className="w-3.5 h-3.5" /> },
];

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 0, high: 1, normal: 2, low: 3,
};

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

  const [castFilters, setCastFilters] = useState<CastFilters>({
    search: '',
    priority: 'all',
    assignment: 'all',
    sort: 'order',
  });
  const [showCastFilters, setShowCastFilters] = useState(false);

  const [addCharOpen,       setAddCharOpen]       = useState(false);
  const [editCharTarget,    setEditCharTarget]    = useState<Character | null>(null);
  const [deleteCharTarget,  setDeleteCharTarget]  = useState<string | null>(null);
  const [isDeletingChar,    setIsDeletingChar]    = useState(false);

  const [assignTarget, setAssignTarget] = useState<Character | null>(null);

  const [uploadTarget, setUploadTarget] = useState<{ character: Character; task: Task } | null>(null);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);

  const [taskFilter, setTaskFilter] = useState<TaskFilter>(DEFAULT_TASK_FILTER);

  const loadProject = useCallback(() => {
    if (!id) return;
    const p = getProject(id);
    setProject(p ?? null);
  }, [id, getProject]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const handleCharacterAdded = useCallback(() => {
    refreshProjects();
    loadProject();
    setAddCharOpen(false);
  }, [refreshProjects, loadProject]);

  const handleCharacterEdited = useCallback(() => {
    refreshProjects();
    loadProject();
    setEditCharTarget(null);
  }, [refreshProjects, loadProject]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!id || !deleteCharTarget) return;
    setIsDeletingChar(true);
    try {
      await deleteCharacter(id, deleteCharTarget);
      refreshProjects();
      loadProject();
    } finally {
      setIsDeletingChar(false);
      setDeleteCharTarget(null);
    }
  }, [id, deleteCharTarget, deleteCharacter, refreshProjects, loadProject]);

  const handleArtistAssigned = useCallback(() => {
    refreshProjects();
    loadProject();
    setAssignTarget(null);
  }, [refreshProjects, loadProject]);

  const handleUploadSuccess = useCallback(() => {
    refreshProjects();
    loadProject();
    setUploadTarget(null);
  }, [refreshProjects, loadProject]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setTaskPanelOpen(true);
  }, []);

  // Filtered characters
  const filteredCharacters = useMemo(() => {
    if (!project) return [];
    let chars = [...project.characters];
    if (castFilters.search) {
      const q = castFilters.search.toLowerCase();
      chars = chars.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }
    if (castFilters.priority !== 'all') {
      chars = chars.filter((c) => c.priority === castFilters.priority);
    }
    if (castFilters.assignment !== 'all') {
      chars = chars.filter((c) => {
        const task = project.tasks?.find((t) => t.characterId === c.id);
        if (castFilters.assignment === 'assigned') return !!task?.assignedTo;
        return !task?.assignedTo;
      });
    }
    if (castFilters.sort === 'priority') {
      chars.sort(
        (a, b) =>
          (PRIORITY_WEIGHT[a.priority ?? 'normal'] ?? 2) -
          (PRIORITY_WEIGHT[b.priority ?? 'normal'] ?? 2)
      );
    } else if (castFilters.sort === 'name') {
      chars.sort((a, b) => a.name.localeCompare(b.name));
    }
    return chars;
  }, [project, castFilters]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!project?.tasks) return [];
    return filterTasks(project.tasks, taskFilter);
  }, [project, taskFilter]);

  const progress = useMemo(
    () => (project ? computeProjectProgress(project) : null),
    [project]
  );

  if (project === undefined) return <FullPageSpinner />;
  if (project === null) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Proje Bulunamadı" />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<AlertCircle size={32} />}
            title="Proje bulunamadı"
            description="Bu proje mevcut değil veya erişim izniniz yok."
            action={
              <Button onClick={() => navigate('/projects')}>
                Projelere Dön
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={project.title}
        subtitle={project.clientName}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => navigate('/projects')}
            >
              Geri
            </Button>
            {canWrite && (
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
        {/* Progress header */}
        {progress && (
          <div className="px-6 pt-6">
            <ProjectProgressHeader project={project} progress={progress} />
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex items-center gap-1 px-6 mt-4 border-b"
          style={{ borderColor: 'var(--border-base)' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
              style={{
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                borderColor: activeTab === tab.key ? 'var(--text-primary)' : 'transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">

          {/* CAST TAB */}
          {activeTab === 'cast' && (
            <>
              <CastListHeader
                filters={castFilters}
                onChange={setCastFilters}
                showFilters={showCastFilters}
                onToggleFilters={() => setShowCastFilters((v) => !v)}
                totalCount={project.characters.length}
                filteredCount={filteredCharacters.length}
              />
              {filteredCharacters.length === 0 ? (
                <EmptyState
                  icon={<User size={32} />}
                  title="Karakter bulunamadı"
                  description={
                    project.characters.length === 0
                      ? 'Projeye henüz karakter eklenmemiş.'
                      : 'Filtrelerinizi değiştirin.'
                  }
                  action={
                    canWrite ? (
                      <Button
                        leftIcon={<Plus size={14} />}
                        onClick={() => setAddCharOpen(true)}
                      >
                        Karakter Ekle
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCharacters.map((char) => {
                    const task = project.tasks?.find((t) => t.characterId === char.id);
                    return (
                      <CastCard
                        key={char.id}
                        character={char}
                        task={task}
                        canWrite={canWrite}
                        isArtist={isArtist}
                        currentUserId={currentUser?.id}
                        onEdit={() => setEditCharTarget(char)}
                        onDelete={() => setDeleteCharTarget(char.id)}
                        onAssign={() => setAssignTarget(char)}
                        onUpload={
                          task
                            ? () => setUploadTarget({ character: char, task })
                            : undefined
                        }
                        onTaskClick={task ? () => handleTaskClick(task) : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <>
              <TaskFilterBar
                filter={taskFilter}
                onChange={setTaskFilter}
                tasks={project.tasks ?? []}
              />
              {filteredTasks.length === 0 ? (
                <EmptyState
                  icon={<Mic2 size={32} />}
                  title="Görev bulunamadı"
                  description="Filtrelerinizi değiştirin."
                />
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => handleTaskClick(task)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && progress && (
            <CastSummaryPanel project={project} progress={progress} />
          )}

          {/* INFO TAB */}
          {activeTab === 'info' && (
            <Card>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      Durum
                    </p>
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: `${PROJECT_STATUS_COLORS[project.status]}20`,
                        color: PROJECT_STATUS_COLORS[project.status],
                      }}
                    >
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      Müşteri
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {project.clientName}
                    </p>
                  </div>
                  {project.dueDate && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                        Bitiş Tarihi
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(project.dueDate)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      Son Güncelleme
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {formatRelativeDate(project.updatedAt)}
                    </p>
                  </div>
                </div>
                {project.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                      Açıklama
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {project.description}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {addCharOpen && id && (
        <AddCharacterModal
          isOpen={addCharOpen}
          onClose={() => setAddCharOpen(false)}
          projectId={id}
          onSuccess={handleCharacterAdded}
        />
      )}

      {editCharTarget && id && (
        <EditCharacterModal
          isOpen={!!editCharTarget}
          onClose={() => setEditCharTarget(null)}
          projectId={id}
          character={editCharTarget}
          onSuccess={handleCharacterEdited}
        />
      )}

      {assignTarget && id && (
        <AssignArtistModal
          isOpen={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          projectId={id}
          character={assignTarget}
          onSuccess={handleArtistAssigned}
        />
      )}

      {uploadTarget && id && (
        <BulkUploadModal
          isOpen={!!uploadTarget}
          onClose={() => setUploadTarget(null)}
          projectId={id}
          projectTitle={project.title}
          character={uploadTarget.character}
          task={uploadTarget.task}
          onSuccess={handleUploadSuccess}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteCharTarget}
        onClose={() => setDeleteCharTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Karakteri Sil"
        message="Bu karakteri silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        isLoading={isDeletingChar}
        variant="danger"
      />

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          isOpen={taskPanelOpen}
          onClose={() => { setTaskPanelOpen(false); setSelectedTask(null); }}
          onUpload={(taskId, projectId, file) => uploadRecording(projectId, taskId, file)}
          projectId={id}
        />
      )}
    </div>
  );
}
