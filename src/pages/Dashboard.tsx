// ============================================================
// DASHBOARD PAGE
// Rol bazlı dashboard:
//   Admin / PM     → ManagerDashboard
//   Sanatçı        → Görevlerim özeti (projects'ten useMemo)
//   QC             → Bekleyen kayıtlar (line bazlı)
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

// ─── Artist görevlerini projects'ten türet ──────────────────
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
        projectTitle:         project.title,
        projectColor:         project.coverColor ?? '#6B7280',
        clientName:           project.clientName,
        characterDescription: character?.description,
        voiceNotes:           character?.voiceNotes,
        characterGender:      character?.gender,
        characterPriority:    character?.priority,
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

  // ── Sanatçı görevleri — projects state'inden türetilir.
  // projects her güncellendiğinde (QC, upload, atama) otomatik güncellenir.
  const myTasks = useMemo<MyTask[]>(
    () =>
      currentUser?.role === 'voice_artist'
        ? deriveArtistTasks(projects, currentUser.id)
        : [],
    [currentUser, projects]
  );

  // ── QC için line bazlı pending sayımı
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
          else pending++; // 'recorded'
        }
      }
    }
    return { pending, approved, rejected, total };
  }, [currentUser, projects]);

  if (isLoading || !currentUser) return <FullPageSpinner />;

  // ── Admin / PM View ────────────────────────────────────────
  if (currentUser.role === 'admin' || currentUser.role === 'project_manager') {
    return <ManagerDashboard currentUser={currentUser} projects={projects} />;
  }

  // ── Voice Artist View ──────────────────────────────────────
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

          {/* Stat kartları */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Toplam Görev"  value={myTasks.length} icon={<Mic2 className="w-5 h-5" />} />
            <StatCard label="Bekliyor"      value={pending}        icon={<Clock className="w-5 h-5" />} />
            <StatCard label="QC Bekliyor"   value={uploaded}       icon={<Upload className="w-5 h-5" />} />
            <StatCard label="Tamamlanan"    value={done}           icon={<CheckCircle2 className="w-5 h-5" />} />
          </div>

          {/* QC Reddedilen uyarı */}
          {rejectedTasks.length > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--text-primary)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {rejectedTasks.length} görev reddedildi
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  QC notlarını oku ve kaydı tekrar yükle.
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/my-tasks')}>
                Göster
              </Button>
            </div>
          )}

          {/* Devam eden uyarı */}
          {inProgress > 0 && rejectedTasks.length === 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              <Mic2 className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold">{inProgress} görev</span> devam ediyor —{' '}
                <button
                  className="underline hover:no-underline transition-all"
                  onClick={() => navigate('/my-tasks')}
                >
                  görev listesine git
                </button>
              </p>
            </div>
          )}

          {/* Görev listesi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Atanmış Görevler
              </h2>
              <button
                onClick={() => navigate('/my-tasks')}
                className="text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                Tümünü gör →
              </button>
            </div>

            {myTasks.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <Mic2 className="w-8 h-8 mb-2" style={{ color: 'var(--border-strong)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Henüz görev atanmamış.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {myTasks.slice(0, 8).map((task) => {
                  const lines          = task.lines ?? [];
                  const completedLines = lines.filter((l) => l.status === 'approved').length;
                  const totalLines     = lines.length || task.lineCount;
                  const pct            = totalLines > 0
                    ? Math.round((completedLines / totalLines) * 100)
                    : 0;

                  return (
                    <Card key={task.id} hoverable onClick={() => navigate('/my-tasks')}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {task.characterName}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {task.projectTitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {totalLines > 0 && (
                            <div className="hidden sm:flex flex-col items-end">
                              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                                {completedLines}/{totalLines}
                              </span>
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                replik
                              </span>
                            </div>
                          )}
                          <Badge
                            label={TASK_STATUS_LABELS[task.status]}
                            className={TASK_STATUS_COLORS[task.status]}
                          />
                        </div>
                      </div>

                      {totalLines > 0 && (
                        <div className="mt-3">
                          <div
                            className="h-1 rounded-full overflow-hidden"
                            style={{ background: 'var(--bg-elevated)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: 'var(--progress-fill)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}

                {myTasks.length > 8 && (
                  <button
                    className="w-full py-3 text-sm transition-colors text-center rounded-xl"
                    style={{
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                    onClick={() => navigate('/my-tasks')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    +{myTasks.length - 8} görevi daha gör
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── QC Reviewer View ───────────────────────────────────────
  const qs = qcStats ?? { pending: 0, approved: 0, rejected: 0, total: 0 };

  // Proje bazlı: recorded satırı olan task'lar
  const pendingTasks = projects.flatMap((p) =>
    (p.tasks ?? [])
      .filter((t) => (t.lines ?? []).some((l) => l.status === 'recorded'))
      .map((t) => ({ ...t, projectTitle: p.title, projectId: p.id }))
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="QC İnceleme"
        subtitle={`${qs.pending} satır inceleme bekliyor`}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="İnceleme Bekleyen" value={qs.pending}  icon={<Upload className="w-5 h-5" />} />
          <StatCard label="Onaylandı"         value={qs.approved} icon={<CheckCircle2 className="w-5 h-5" />} />
          <StatCard label="Reddedildi"        value={qs.rejected} icon={<AlertTriangle className="w-5 h-5" />} />
          <StatCard label="Toplam Satır"      value={qs.total}    icon={<Mic2 className="w-5 h-5" />} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              İnceleme Bekleyen Görevler
            </h2>
            <Button size="sm" variant="ghost" onClick={() => navigate('/qc')}>
              QC sayfasına git →
            </Button>
          </div>

          {pendingTasks.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <CheckCircle2 className="w-8 h-8 mb-2" style={{ color: 'var(--border-strong)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                İncelenecek kayıt yok. 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((task) => {
                const recordedCount = (task.lines ?? []).filter(
                  (l) => l.status === 'recorded'
                ).length;
                return (
                  <Card
                    key={task.id}
                    hoverable
                    onClick={() => navigate(`/projects/${task.projectId}`)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {task.characterName}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {task.projectTitle} · {task.assignedArtistName ?? 'Atanmamış'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                          {formatRelativeDate(task.updatedAt)}
                        </span>
                        <Badge
                          label={`${recordedCount} satır`}
                          className={TASK_STATUS_COLORS['uploaded']}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
