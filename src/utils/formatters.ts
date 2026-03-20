// ============================================================
// FORMATTERS — Tarih, dosya boyutu, durum etiketleri
// Renk paleti: yalnızca siyah/beyaz/gri tonları
// ============================================================
import type { TaskStatus, ProjectStatus, UserRole } from '../types';

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  if (days < 7) return `${days} gün önce`;
  if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
  return formatDate(iso);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Status Labels ────────────────────────────────────────────
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending:      'Bekliyor',
  in_progress:  'Kayıt Yapılıyor',
  uploaded:     'Yüklendi',
  qc_approved:  'QC Onaylandı',
  qc_rejected:  'QC Reddedildi',
  mixed:        'Mix Tamamlandı',
  final:        'Final',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active:    'Aktif',
  completed: 'Tamamlandı',
  on_hold:   'Beklemede',
  archived:  'Arşivlendi',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:           'Admin',
  project_manager: 'Proje Yöneticisi',
  voice_artist:    'Seslendirme Sanatçısı',
  qc_reviewer:     'QC Uzmanı',
};

// ─── Status Colors (Monochrome) ────────────────────────────────
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending:     'bg-neutral-100 text-neutral-500 border border-neutral-200',
  in_progress: 'bg-neutral-800 text-white border border-neutral-700',
  uploaded:    'bg-neutral-700 text-white border border-neutral-600',
  qc_approved: 'bg-neutral-900 text-white border border-neutral-800',
  qc_rejected: 'bg-neutral-200 text-neutral-700 border border-neutral-300',
  mixed:       'bg-neutral-600 text-white border border-neutral-500',
  final:       'bg-black text-white border border-black',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  active:    'bg-neutral-900 text-white border border-neutral-800',
  completed: 'bg-black text-white border border-black',
  on_hold:   'bg-neutral-200 text-neutral-600 border border-neutral-300',
  archived:  'bg-neutral-100 text-neutral-400 border border-neutral-200',
};
