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

        {/* ── Stat Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Toplam Proje"     value={overall.totalProjects}                      icon={<FolderOpen className="w-5 h-5" />} />
          <StatCard label="Aktif Proje"      value={overall.activeProjects}                     icon={<Clock className="w-5 h-5" />} />
          <StatCard label="Devam Eden"       value={inProgressTasks + uploadedTasks}            icon={<Mic2 className="w-5 h-5" />} />
          <StatCard label="Tamamlanan Görev" value={doneTasks}                                  icon={<CheckCircle2 className="w-5 h-5" />} />
        </div>

        {/* ── Genel İlerleme ────────────────────────────────────────── */}
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

        {/* ── Proje Listesi ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">

            {/* Tab filtreleri */}
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
                  >
                    {tab.label}
                    <span
                      className="text-[10px] px-1 rounded"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.15)' : 'var(--bg-base)',
                        color: isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View mod */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('table')}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  background: viewMode === 'table' ? 'var(--bg-elevated)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: viewMode === 'table' ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  background: viewMode === 'grid' ? 'var(--bg-elevated)' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: viewMode === 'grid' ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <Card className="py-10 text-center">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Bu kategoride proje yok.</p>
            </Card>
          ) : viewMode === 'table' ? (
            <ProjectSummaryTable projects={filteredProjects} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  canManage
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Son Aktivite ──────────────────────────────────────────── */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300">Son Görev Aktiviteleri</h3>
          </div>
          <RecentActivityTable tasks={allTasks} projects={projects} maxRows={8} />
        </Card>

      </div>
    </div>
  );
}
