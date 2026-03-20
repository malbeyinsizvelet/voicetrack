// ============================================================
// CORE DOMAIN TYPES
// ============================================================

export type UserRole = 'admin' | 'project_manager' | 'voice_artist' | 'qc_reviewer';
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived';
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'uploaded'
  | 'qc_approved'
  | 'qc_rejected'
  | 'mixed'
  | 'final';

export type AudioFileType = 'source' | 'recorded' | 'mixed' | 'final';

// ─── User ────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

// ─── AudioFile ───────────────────────────────────────────────
export interface AudioFile {
  id: string;
  taskId: string;
  type: AudioFileType;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  duration?: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

// ─── LineStatus ──────────────────────────────────────────────
export type LineStatus =
  | 'pending'
  | 'recorded'
  | 'approved'
  | 'rejected'
  | 'retake';

// ─── RecordingVersion ─────────────────────────────────────────
export interface RecordingVersion {
  version: number;
  file: AudioFile;
  uploadedAt: string;
  uploadedBy: string;
  qcStatus?: 'pending' | 'approved' | 'rejected';
  qcNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ─── RecordingLine ───────────────────────────────────────────
export interface RecordingLine {
  id: string;
  taskId: string;
  lineNumber: number;
  originalText?: string;
  translatedText?: string;
  timecode?: string;
  status: LineStatus;
  sourceFile?: AudioFile;
  recordedFile?: AudioFile;
  versions?: RecordingVersion[];
  directorNote?: string;
  artistNote?: string;
  qcNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  retakeCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Task (Kayıt Görevi) ─────────────────────────────────────
export interface Task {
  id: string;
  projectId: string;
  characterId: string;
  characterName: string;
  assignedTo?: string;
  assignedArtistName?: string;
  lineCount: number;
  status: TaskStatus;
  sourceFiles: AudioFile[];
  recordedFiles: AudioFile[];
  lines: RecordingLine[];
  notes?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Character ───────────────────────────────────────────────
export type CharacterGender = 'male' | 'female' | 'neutral' | 'unknown';
export type CharacterPriority = 'critical' | 'high' | 'normal' | 'low';

export interface Character {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  voiceNotes?: string;
  gender?: CharacterGender;
  priority?: CharacterPriority;
  assignedArtistId?: string;
  assignedArtistName?: string;
  lineCount?: number;
  completedCount?: number;
  taskId?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Project ─────────────────────────────────────────────────
export interface Project {
  id: string;
  title: string;
  clientName: string;
  description?: string;
  status: ProjectStatus;
  managerId: string;
  managerName: string;
  characters: Character[];
  tasks: Task[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  coverColor?: string;
}

// ─── Auth ────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export type Permission =
  | 'projects:read'
  | 'projects:write'
  | 'projects:delete'
  | 'tasks:read'
  | 'tasks:write'
  | 'tasks:upload'
  | 'qc:read'
  | 'qc:approve'
  | 'users:manage'
  | 'settings:read'
  | 'settings:write';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'projects:read', 'projects:write', 'projects:delete',
    'tasks:read', 'tasks:write', 'tasks:upload',
    'qc:read', 'qc:approve',
    'users:manage', 'settings:read', 'settings:write',
  ],
  project_manager: [
    'projects:read', 'projects:write',
    'tasks:read', 'tasks:write',
    'qc:read', 'settings:read',
  ],
  voice_artist: [
    'tasks:read', 'tasks:upload', 'settings:read',
  ],
  qc_reviewer: [
    'projects:read', 'tasks:read',
    'qc:read', 'qc:approve', 'settings:read',
  ],
};

// ─── Forms ───────────────────────────────────────────────────
export interface ProjectFormData {
  title: string;
  clientName: string;
  description?: string;
  status: ProjectStatus;
  managerId: string;
  managerName: string;
  dueDate?: string;
  coverColor?: string;
}

export interface CharacterFormData {
  name: string;
  description?: string;
  voiceNotes?: string;
  gender?: CharacterGender;
  priority?: CharacterPriority;
  assignedArtistId?: string;
  assignedArtistName?: string;
  lineCount?: number;
  completedCount?: number;
  order?: number;
}

// ─── Artist View ─────────────────────────────────────────────
export interface MyTask extends Task {
  projectTitle: string;
  projectColor: string;
  clientName: string;
  characterDescription?: string;
  voiceNotes?: string;
  characterGender?: CharacterGender;
  characterPriority?: CharacterPriority;
}

export interface AssignArtistPayload {
  artistId: string;
  artistName: string;
}

// ─── Bulk Upload ─────────────────────────────────────────────
export type UploadFileStatus =
  | 'queued'
  | 'parsing'
  | 'uploading'
  | 'done'
  | 'error'
  | 'duplicate'
  | 'skipped';

export interface UploadedFileEntry {
  file: File;
  uid: string;
  baseName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl: string;
  estimatedDuration?: number;
  status: UploadFileStatus;
  progress: number;
  errorMessage?: string;
  createdLineId?: string;
}

export interface BulkUploadResult {
  taskId: string;
  characterId: string;
  totalFiles: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  skippedCount: number;
  newLineCount: number;
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  uploadedTasks: number;
}

// ─── Filtering & Search ──────────────────────────────────────
export interface TaskFilter {
  search: string;
  status: TaskStatus | 'all';
  lineStatus: LineStatus | 'all';
  hasRecorded: boolean | null;
  hasPending: boolean | null;
  sort: TaskSortKey;
  sortDir: 'asc' | 'desc';
}

export type TaskSortKey =
  | 'character'
  | 'status'
  | 'progress'
  | 'updated'
  | 'lines';

export interface LineFilter {
  search: string;
  status: LineStatus | 'all';
  hasRecorded: boolean | null;
  sort: 'number' | 'status';
}

export interface SearchMatch {
  taskId: string;
  lineId?: string;
  characterName: string;
  matchField: 'character' | 'lineText' | 'fileName' | 'timecode' | 'note';
  snippet: string;
  query: string;
}

// ─── QC ──────────────────────────────────────────────────────
export type QCStatus = 'pending' | 'approved' | 'revision_requested';

export interface QCReview {
  id: string;
  projectId: string;
  projectTitle: string;
  characterId: string;
  characterName: string;
  taskId: string;
  lineId: string;
  lineNumber: number;
  originalText?: string;
  translatedText?: string;
  timecode?: string;
  artistId: string;
  artistName: string;
  sourceFile?: AudioFile;
  recordedFile?: AudioFile;
  currentVersion?: number;
  totalVersions?: number;
  qcStatus: QCStatus;
  qcNote?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  submittedAt: string;
}

// ─── Settings ────────────────────────────────────────────────
export interface AppSettings {
  general: {
    defaultLanguage: 'tr' | 'en';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    defaultTheme: 'dark' | 'light';
    defaultLandingPage: 'dashboard' | 'projects' | 'my-tasks';
  };
  files: {
    allowedFormats: string[];
    maxFileSizeMB: number;
    sourceFolder: string;
    recordedFolder: string;
    autoNameFromFileName: boolean;
  };
  qc: {
    qcRequired: boolean;
    revisionNoteRequired: boolean;
    showQCNotesToArtist: boolean;
    autoStatusOnApprove: TaskStatus;
    autoStatusOnReject: TaskStatus;
  };
  permissions: {
    roleModuleAccess: Record<UserRole, string[]>;
  };
}

// ─── Progress ────────────────────────────────────────────────
export interface CastProgress {
  characterId: string;
  characterName: string;
  taskId: string;
  assignedArtistName: string;
  totalLines: number;
  pendingLines: number;
  recordedLines: number;
  approvedLines: number;
  rejectedLines: number;
  retakeLines: number;
  completedLines: number;
  progressPercent: number;
  taskStatus: TaskStatus;
  priority?: CharacterPriority;
  gender?: CharacterGender;
}

export interface ProjectProgress {
  projectId: string;
  projectTitle: string;
  totalLines: number;
  completedLines: number;
  recordedLines: number;
  pendingLines: number;
  rejectedLines: number;
  progressPercent: number;
  castProgresses: CastProgress[];
  tasksByStatus: Record<string, number>;
  totalCasts: number;
  completedTasks: number;
  inProgressTasks: number;
  uploadedTasks: number;
}
