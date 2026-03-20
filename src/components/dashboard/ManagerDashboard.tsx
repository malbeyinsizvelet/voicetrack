import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Plus, List, LayoutGrid, AlertCircle, Clock, CheckCircle2, Mic2,
} from 'lucide-react';
import { Button }                from '../ui/Button';
import { StatCard }              from '../ui/StatCard';
import { Card }                  from '../ui/Card';
import { TopBar }                from '../layout/TopBar';
import { OverallProgressBanner } from './OverallProgressBanner';
import { ProjectSummaryTable }   from './ProjectSummaryTable';
import { ProjectCard }           from '../projects/ProjectCard';
import { RecentActivityTable }   from './RecentActivityTable';
import { computeOverallProgress } from '../../services/progressService';
import type { Project, User }    from '../../types';

interface ManagerDashboardProps {
  currentUser: User;
  projects: Project[];
  onCreateProject?: () => void;
}

type ViewMode   = 'table' | 'grid';
type ProjectTab = 'all' | 'active' | 'completed' | 'on_hold';

const PROJECT_TABS: { key: ProjectTab; label: string }[] = [
  { key: 'all',       label: 'Tümü' },
  { key: 'active',    label: 'Aktif' },
  { key: 'on_hold',   label: 'Beklemede' },
  { key: 'completed', label: 'Tamamlandı' },
];

export function ManagerDashboard({ currentUser, projects, onCreateProject }: ManagerDashboardProps) {
  const navigate = useNavigate();
  const [viewMode,   setViewMode]   = useState<ViewMode>('table');
  const [projectTab, setProjectTab] = useState<ProjectTab>('all');

  const overall = useMemo(() => computeOverallProgress(projects), [projects]);
  const allTasks = useMemo(() => projects.flatMap((p) => p.tasks), [projects]);

  const pendingTasks    = allTasks.filter((t) => t.status === 'pending').length;
  const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress').length;
  const uploadedTasks   = allTasks.filter((t) => t.status === 'uploaded').length;
  const doneTasks       = allTasks.filter((t) =>
    ['qc_approved', 'mixed', 'final'].includes(t.status)
  ).length;

  const filteredProjects = useMemo(() => {
    if (projectTab === 'all') return projects;
    return projects.filter((p) => p.status === projectTab);
  }, [projects, projectTab]);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Dashboard"
        subtitle={`Hoş geldin, ${currentUser.name.split(' ')[0]}`}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={onCreateProject}>
              Yeni Proje
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<FolderOpen className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/projects')}>
              Tüm Projeler
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Stat Cards ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Toplam Proje"     value={overall.totalProjects}         icon={<FolderOpen className="w-5 h-5" />} />
          <StatCard label="Aktif Proje"      value={overall.activeProjects}        icon={<Clock className="w-5 h-5" />} />
          <StatCard label="Devam Eden"       value={inProgressTasks + uploadedTasks} icon={<Mic2 className="w-5 h-5" />} />
          <StatCard label="Tamamlanan Görev" value={doneTasks}                     icon={<CheckCircle2 className="w-5 h-5" />} />
        </div>

        {/* ── Genel İlerleme ─────────────────────── */}
        <OverallProgressBanner
          totalProjects={overall.totalProjects}
          activeProjects={overall.activeProjects}
          totalLines={overall.totalLines}
          completedLines={overall.completedLines}
          recordedLines={overall.recordedLines}
          pendingLines={overall.pendingLines}
          progressPercent={overall.overallPercent}
          totalCasts={allTasks.length}
          assignedCasts={allTasks.filter((t) => t.assignedArtistName && t.assignedArtistName !== 'Atanmamış').length}
        />

        {/* ── Proje Listesi ─────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">

            {/* Tab filtreler */}
            <div
              className="flex gap-0.5 rounded-lg p-0.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              {PROJECT_TABS.map((tab) => {
                const count = tab.key === 'all'
                  ? projects.length
                  : projects.filter((p) => p.status === tab.key).length;
                const isActive = projectTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setProjectTab(tab.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    {tab.label}
                    <span
                      className="text-[10px] px-1 rounded"
                      style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-muted)', opacity: 0.7 }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View mode toggle */}
            <div
              className="flex items-center gap-0.5 rounded-lg p-0.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              {([
                { mode: 'table' as ViewMode, Icon: List,       title: 'Tablo görünümü' },
                { mode: 'grid'  as ViewMode, Icon: LayoutGrid, title: 'Kart görünümü'  },
              ] as const).map(({ mode, Icon, title }) => {
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="p-1.5 rounded-md transition-all"
                    title={title}
                    style={{
                      background: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <AlertCircle className="w-8 h-8 mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Bu filtrede proje bulunamadı.
              </p>
              <button
                className="mt-2 text-xs underline transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onClick={() => setProjectTab('all')}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Tümünü göster
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <ProjectSummaryTable projects={filteredProjects} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Son Aktiviteler ─────────────────────── */}
        {allTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Son Görev Aktiviteleri
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {allTasks.length} görev toplam
              </span>
            </div>
            <Card className="p-0 overflow-hidden">
              <RecentActivityTable tasks={allTasks} projects={projects} maxRows={10} />
            </Card>
          </div>
        )}

        {/* ── Bekleyen Uyarı ────────────────────── */}
        {pendingTasks > 0 && (
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {pendingTasks} görev henüz başlanmamış
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Bu görevler için kaynak ses yüklendi ancak sanatçı henüz kayıt yapmadı.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
