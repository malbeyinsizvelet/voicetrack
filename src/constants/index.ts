import type { TaskStatus, LineStatus, ProjectStatus, UserRole } from '../types';

export const APP_NAME = 'VoiceTrack Studio';
export const APP_VERSION = '0.13.0';

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export const TOKEN_REFRESH_THRESHOLD_MS = 30 * 60 * 1000;

export const ALLOWED_AUDIO_TYPES = [
  'audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3',
  'audio/flac', 'audio/aiff', 'audio/x-aiff', 'audio/ogg',
];
export const ALLOWED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.flac', '.aiff', '.ogg'];
export const MAX_FILE_SIZE_MB = 200;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_BULK_FILES = 500;

export const DEFAULT_PAGE_SIZE = 20;
export const TASKS_PAGE_SIZE = 50;

export const MOCK_DELAY = {
  short: 150,
  normal: 300,
  long: 600,
  upload: 800,
} as const;

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Bekliyor',
  in_progress: 'Devam Ediyor',
  uploaded: 'Yüklendi',
  qc_approved: 'QC Onaylandı',
  qc_rejected: 'QC Reddedildi',
  mixed: 'Mix Tamamlandı',
  final: 'Final',
};

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  pending: 'gray',
  in_progress: 'blue',
  uploaded: 'indigo',
  qc_approved: 'green',
  qc_rejected: 'red',
  mixed: 'purple',
  final: 'emerald',
};

export const LINE_STATUS_LABEL: Record<LineStatus, string> = {
  pending: 'Bekliyor',
  recorded: 'Kaydedildi',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  retake: 'Retake',
};

export const LINE_STATUS_COLOR: Record<LineStatus, string> = {
  pending: 'gray',
  recorded: 'blue',
  approved: 'green',
  rejected: 'red',
  retake: 'amber',
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  on_hold: 'Beklemede',
  archived: 'Arşivlendi',
};

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  active: 'green',
  completed: 'blue',
  on_hold: 'amber',
  archived: 'gray',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  project_manager: 'Proje Yöneticisi',
  voice_artist: 'Seslendirme Sanatçısı',
  qc_reviewer: 'QC Uzmanı',
};

export const ROLE_COLOR: Record<UserRole, string> = {
  admin: 'red',
  project_manager: 'violet',
  voice_artist: 'indigo',
  qc_reviewer: 'amber',
};

export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  projects: '/projects',
  projectDetail: (id: string) => `/projects/${id}`,
  myTasks: '/my-tasks',
  settings: '/settings',
  unauthorized: '/unauthorized',
} as const;
