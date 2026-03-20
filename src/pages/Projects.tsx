// ============================================================
// PROJECTS PAGE – Phase 14 Polish
// Proje listesi: arama, filtre, skeleton loading, boş durum.
// ============================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { useProjects } from '../context/ProjectContext';
import { usePermission } from '../hooks/usePermission';
import { cn } from '../utils/cn';
import type { ProjectStatus } from '../types';

const STATUS_FILTER_OPTIONS = [
  { value: 'all',       label: 'Tüm Durumlar' },
  { value: 'active',    label: 'Aktif' },
  { value: 'on_hold',   label: 'Beklemede' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'archived',  label: 'Arşivlendi' },
];

export function Projects() {
  const navigate  = useNavigate();
  const { projects, isLoading, deleteProject } = useProjects();
  const canWrite  = usePermission('projects:write');
  const canDelete = usePermission('projects:delete');

  const [createOpen,  setCreateOpen]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const hasFilters = search !== '' || statusFilter !== 'all';

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await deleteProject(deleteTarget);
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); };

  const deleteTargetProject = projects.find((p) => p.id === deleteTarget);

  return (
    <div className="flex flex-col h-full">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <TopBar
        title="Projeler"
        subtitle={isLoading ? 'Yükleniyor…' : `${projects.length} proje`}
        actions={
          canWrite ? (
            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setCreateOpen(true)}
            >
              Yeni Proje
            </Button>
          ) : undefined
        }
      />

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-800/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Proje adı, müşteri veya açıklama ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftElement={<Search className="w-4 h-4" />}
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
                'border transition-colors interactive',
                showFilters || statusFilter !== 'all'
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filtre</span>
              {statusFilter !== 'all' && (
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
              )}
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                title="Filtreleri temizle"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500
                           hover:text-slate-200 hover:bg-slate-800 border border-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Expanded filter row */}
          {showFilters && (
            <div className="flex items-center gap-3 animate-slide-down">
              <span className="text-xs text-slate-500 shrink-0">Durum:</span>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value as 'all' | ProjectStatus)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                      statusFilter === opt.value
                        ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="w-8 h-8" />}
              title={hasFilters ? 'Sonuç bulunamadı' : 'Henüz proje yok'}
              description={
                hasFilters
                  ? 'Filtre veya arama kriterlerini değiştirmeyi deneyin.'
                  : 'İlk projeyi oluşturmak için "Yeni Proje" butonuna tıklayın.'
              }
              action={
                hasFilters ? (
                  <Button size="sm" variant="secondary" onClick={clearFilters}>Filtreleri Temizle</Button>
                ) : canWrite ? (
                  <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setCreateOpen(true)}>Yeni Proje</Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  canManage={canWrite}
                  onDelete={canDelete ? () => setDeleteTarget(project.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {canWrite && (
        <CreateProjectModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Projeyi Sil"
        description={`"${deleteTargetProject?.title}" projesini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
      />
    </div>
  );
}
