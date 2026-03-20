// ============================================================
// PROGRESS SERVICE — monochrome, safe array access
// ============================================================

import type { Project, Task, CastProgress, ProjectProgress, TaskStatus, CharacterPriority } from '../types';

const pct = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10;
};

// ── Safe line counters — task.lines her zaman array olmalı ama güvenli ──

export const countCompletedLines = (task: Task): number =>
  (task.lines ?? []).filter((l) => l.status === 'approved').length;

export const countRecordedLines = (task: Task): number =>
  (task.lines ?? []).filter((l) => l.status === 'recorded').length;

export const countPendingLines = (task: Task): number =>
  (task.lines ?? []).filter((l) => l.status === 'pending').length;

export const countRejectedLines = (task: Task): number =>
  (task.lines ?? []).filter((l) => l.status === 'rejected' || l.status === 'retake').length;

export function formatLineCount(completed: number, total: number): string {
  return `${completed} / ${total}`;
}

// ── Renk yardımcıları (CSS variable-based) ───────────────────

export function progressToColorClass(_percent: number): { ring: string; bar: string; text: string } {
  return {
    ring: 'stroke-current',
    bar:  'vt-progress-fill',
    text: 'vt-text-primary',
  };
}

export function priorityToColorClass(priority: CharacterPriority): { badge: string; dot: string } {
  switch (priority) {
    case 'critical': return { badge: 'bg-[var(--text-primary)] text-[var(--accent-text)]', dot: 'bg-[var(--text-primary)]' };
    case 'high':     return { badge: 'bg-[var(--bg-elevated)] text-[var(--text-primary)]', dot: 'bg-[var(--text-secondary)]' };
    case 'normal':   return { badge: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]', dot: 'bg-[var(--text-muted)]' };
    case 'low':      return { badge: 'bg-[var(--bg-surface)] text-[var(--text-muted)]',     dot: 'bg-[var(--text-disabled)]' };
    default:         return { badge: 'bg-[var(--bg-surface)] text-[var(--text-muted)]',     dot: 'bg-[var(--text-disabled)]' };
  }
}

export function taskStatusToColorClass(status: TaskStatus): string {
  switch (status) {
    case 'pending':     return 'bg-[var(--bg-elevated)] text-[var(--text-muted)]';
    case 'in_progress': return 'bg-[var(--text-primary)] text-[var(--accent-text)]';
    case 'uploaded':    return 'bg-[var(--text-secondary)] text-[var(--accent-text)]';
    case 'qc_approved': return 'bg-[var(--text-primary)] text-[var(--accent-text)]';
    case 'qc_rejected': return 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]';
    case 'mixed':       return 'bg-[var(--text-primary)] text-[var(--accent-text)]';
    case 'final':       return 'bg-[var(--text-primary)] text-[var(--accent-text)]';
    default:            return 'bg-[var(--bg-elevated)] text-[var(--text-muted)]';
  }
}

// ── Cast Progress ─────────────────────────────────────────────

export function computeCastProgress(_project: Project, task: Task): CastProgress {
  const lines          = task.lines ?? [];
  const totalLines     = lines.length > 0 ? lines.length : (task.lineCount ?? 0);
  const approvedLines  = lines.filter((l) => l.status === 'approved').length;
  const recordedLines  = lines.filter((l) => l.status === 'recorded').length;
  const pendingLines   = lines.filter((l) => l.status === 'pending').length;
  const rejectedLines  = lines.filter((l) => l.status === 'rejected').length;
  const retakeLines    = lines.filter((l) => l.status === 'retake').length;
  const completedLines = approvedLines;
  const progressPercent = pct(completedLines, totalLines);

  return {
    taskId:               task.id,
    characterId:          task.characterId ?? '',
    characterName:        task.characterName,
    assignedArtistName:   task.assignedArtistName ?? 'Atanmamış',
    totalLines,
    completedLines,
    approvedLines,
    recordedLines,
    pendingLines,
    rejectedLines,
    retakeLines,
    progressPercent,
    taskStatus:  task.status,
    priority:    'normal',
  };
}

// ── Project Progress ──────────────────────────────────────────

export function computeProjectProgress(project: Project): ProjectProgress {
  const tasks           = project.tasks ?? [];
  const totalCasts      = tasks.length;
  const completedTasks  = tasks.filter((t) => ['qc_approved', 'mixed', 'final'].includes(t.status)).length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const uploadedTasks   = tasks.filter((t) => t.status === 'uploaded').length;

  let totalLines = 0, completedLines = 0, recordedLines = 0, pendingLines = 0, rejectedLines = 0;

  for (const task of tasks) {
    const lines = task.lines ?? [];
    if (lines.length > 0) {
      totalLines     += lines.length;
      completedLines += lines.filter((l) => l.status === 'approved').length;
      recordedLines  += lines.filter((l) => l.status === 'recorded').length;
      pendingLines   += lines.filter((l) => l.status === 'pending').length;
      rejectedLines  += lines.filter((l) => ['rejected', 'retake'].includes(l.status)).length;
    } else {
      totalLines     += task.lineCount ?? 0;
      completedLines += 0; // lineCount var ama gerçek satır yok
    }
  }

  const progressPercent = pct(completedLines, totalLines);
  const tasksByStatus   = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  const castProgresses: CastProgress[] = tasks.map((t) => computeCastProgress(project, t));

  return {
    projectId:        project.id,
    projectTitle:     project.title,
    totalCasts,
    completedTasks,
    inProgressTasks,
    uploadedTasks,
    totalLines,
    completedLines,
    recordedLines,
    pendingLines,
    rejectedLines,
    progressPercent,
    tasksByStatus,
    castProgresses,
  };
}

// ── Overall (tüm projeler) ────────────────────────────────────

export function computeOverallProgress(projects: Project[]) {
  const safeProjects = projects ?? [];
  const progresses   = safeProjects.map(computeProjectProgress);

  const totalProjects  = safeProjects.length;
  const activeProjects = safeProjects.filter((p) => p.status === 'active').length;
  const totalLines     = progresses.reduce((s, p) => s + p.totalLines, 0);
  const completedLines = progresses.reduce((s, p) => s + p.completedLines, 0);
  const recordedLines  = progresses.reduce((s, p) => s + p.recordedLines, 0);
  const pendingLines   = progresses.reduce((s, p) => s + p.pendingLines, 0);
  const overallPercent = pct(completedLines, totalLines);

  return {
    totalProjects,
    activeProjects,
    totalLines,
    completedLines,
    recordedLines,
    pendingLines,
    overallPercent,
    projectProgresses: progresses,
  };
}
