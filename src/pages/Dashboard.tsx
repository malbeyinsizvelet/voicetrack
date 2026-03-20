// ============================================================
// DASHBOARD PAGE
// Rol bazlı dashboard:
//   Admin / PM    → ManagerDashboard
//   Sanatçı       → Görevlerim özeti (projects'ten useMemo)
//   QC            → Bekleyen kayıtlar (line bazlı)
// ============================================================

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic2, CheckCircle2, Clock, Upload, AlertTriangle } from 'lucide-react';
import { TopBar }            from '../components/layout/TopBar';
import { StatCard }          from '../components/ui/StatCard';
import { Card }              from '../components/ui/Card';
import { Badge }             from '../components/ui/Badge';
import { Button }            from '../components/ui/Button';
import { FullPageSpinner }   from '../components/ui/Spinner';
import { ManagerDashboard }  from '../components/dashboard/ManagerDashboard';
import { useAuth }           from '../context/AuthContext';
import { useProjects }       from '../context/ProjectContext';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  formatRelativeDate,
} from '../utils/formatters';
import type { MyTask } from '../types';

function deriveArtistTasks(
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
        projectTitle:        project.title,
        projectColor:        project.coverColor ?? '#6B7280',
        clientName:          project.clientName,
        characterDescription: character?.description,
        voiceNotes:          character?.voiceNotes,
        characterGender:     character?.gender,
        characterPriority:   character?.priority,
      });
    }
  }
  const W: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
  return result.sort((a, b) => {
    const pa = W[a.characterPriority ?? 'normal'] ?? 2;
    const pb = W[b.characterPriority ?? 'normal'] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function Dashboard() {
  const { currentUser }      = useAuth();
  const { projects, isLoading } = useProjects();
  const navigate             = useNavigate();

  const myTasks = useMemo<MyTask[]>(
    () =>
      currentUser?.role === 'voice_artist'
        ? deriveArtistTasks(projects, currentUser.id)
        : [],
    [currentUser, projects]
  );

  const qcStats = useMemo(() => {
    if (currentUser?.role !== 'qc_reviewer') return null;
    let pending = 0, approved = 0, rejected = 0, total = 0;
    for (const p of projects) {
      for (const t of p.tasks ?? []) {
        for (const l of t.lines ?? []) {
          if (l.status === 'pending') continue;
          total++;
          if (l.status === 'approved') approved++;
          else if (l.status === 'rejected' || l.status === 'retake') rejected++;
          else pending++;
        }
      }
    }
    return { pending, approved, rejected, total };
  }, [currentUser, projects]);

  if (isLoading || !currentUser) return <FullPageSpinner />;

  // ── Admin / PM View ──────────────────────────────────────
  if (currentUser.role === 'admin' || currentUser.role === 'project_manager') {
    return <ManagerDashboard currentUser={currentUser} projects={projects} />;
  }

  // ── Voice Artist View ────────────────────────────────────
  if (currentUser.role === 'voice_artist') {
    const pending    = myTasks.filter((t) => t.status === 'pending').length;
    const inProgress = myTasks.filter((t) => t.status === 'in_progress').length;
    const uploaded   = myTasks.filter((t) => t.status === 'uploaded').length;
    const done       = myTasks.filter((t) =>
      ['qc_approved', 'final', 'mixed'].includes(t.status)
    ).length;

    const rejectedTasks = myTasks.filter((t) => t.status === 'qc_rejected');

    return (
      <div className="flex flex-col h-full">
        <TopBar
          title="Görevlerim"
          subtitle={`Hoş geldin, ${currentUser.name.split(' ')[0]} 🎙️`}
          actions={
            <Button
              size="sm"
              leftIcon={<Mic2 className="w-3.5 h-3.5" />}
              onClick={() => navigate('/my-tasks')}
            >
              Tüm Görevler
            </Button>
          }
        />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Toplam Görev"  value={myTasks.length} icon={<Mic2 className="w-5 h-5" />} />
            <StatCard label="Bekliyor"      value={pending}        icon={<Clock className="w-5 h-5" />} />
            <StatCard label="QC Bekliyor"   value={uploaded}       icon={<Upload className="w-5 h-5" />} />
            <StatCard label="Tamamlanan"    value={done}           icon={<CheckCircle2 className="w-5 h-5" />} />
          </div>

          {rejectedTasks.length > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--text-primary)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {rejectedTasks.length} görev reddedildi
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  QC notlarını oku ve kaydı tekrar yükle.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/my-tasks')}>
                Göster
              </Button>
            </div>
          )}

          {myTasks.length > 0 ? (
            <Card>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-base)' }}>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Son Görevler
                </h3>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border-base)' }}>
                {myTasks.slice(0, 8).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => navigate('/my-tasks')}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: task.projectColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {task.characterName}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {task.projectTitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge color={TASK_STATUS_COLORS[task.status]}>
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatRelativeDate(task.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {myTasks.length > 8 && (
                <div className="p-3 text-center">
                  <Button size="sm" variant="ghost" onClick={() => navigate('/my-tasks')}>
                    Tümünü Gör ({myTasks.length})
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Mic2 className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Henüz görev yok
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Bir proje yöneticisi sana görev atadığında burada görünür.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── QC Reviewer View ─────────────────────────────────────
  if (currentUser.role === 'qc_reviewer' && qcStats) {
    return (
      <div className="flex flex-col h-full">
        <TopBar
          title="QC İnceleme"
          subtitle="Bekleyen ses kayıtlarını incele"
          actions={
            <Button
              size="sm"
              onClick={() => navigate('/qc-review')}
            >
              İncelemeye Başla
            </Button>
          }
        />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Toplam"      value={qcStats.total}    icon={<Mic2 className="w-5 h-5" />} />
            <StatCard label="Bekliyor"    value={qcStats.pending}  icon={<Clock className="w-5 h-5" />} />
            <StatCard label="Onaylandı"   value={qcStats.approved} icon={<CheckCircle2 className="w-5 h-5" />} />
            <StatCard label="Reddedildi"  value={qcStats.rejected} icon={<AlertTriangle className="w-5 h-5" />} />
          </div>

          {qcStats.pending > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}
              onClick={() => navigate('/qc-review')}
            >
              <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {qcStats.pending} kayıt inceleme bekliyor
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  QC inceleme sayfasına git
                </p>
              </div>
              <Button size="sm" onClick={() => navigate('/qc-review')}>
                İncele
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <FullPageSpinner />;
}
