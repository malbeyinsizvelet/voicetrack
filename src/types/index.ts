// ============================================================
// CORE DOMAIN TYPES
// Gerçek backend entegrasyonunda bu tipler API response'larıyla eşleşecek.
// ============================================================

export type UserRole = 'admin' | 'project_manager' | 'voice_artist' | 'qc_reviewer';

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived';

export type TaskStatus =
  | 'pending'       // Henüz başlanmadı
  | 'in_progress'   // Kayıt devam ediyor
  | 'uploaded'      // Sanatçı yükledi, QC bekliyor
  | 'qc_approved'   // QC onayladı
  | 'qc_rejected'   // QC reddetti, tekrar gerekiyor
  | 'mixed'         // Mix/master aşaması tamamlandı
  | 'final';        // Final, teslime hazır

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
  fileSize: number;     // bytes
  mimeType?: string;    // audio/wav, audio/mpeg vb. — gerçek sistemde zorunlu
  duration?: number;    // seconds
  url: string;          // Gerçek sistemde: cloud storage presigned URL veya CDN URL
  uploadedBy: string;   // userId
  uploadedAt: string;   // ISO string
  // Gerçek sistemde eklenir:
  // storageKey?: string;  // S3/GCS object key
  // checksum?: string;    // MD5/SHA256 bütünlük kontrolü
}

// ─── LineStatus ───────────────────────────────────────────────
export type LineStatus =
  | 'pending'      // Henüz kaydedilmedi
  | 'recorded'     // Sanatçı kaydetti, QC bekliyor
  | 'approved'     // QC onayladı
  | 'rejected'     // QC reddetti, tekrar gerekiyor
  | 'retake';      // Yönetmen retake istedi

// ─── RecordingVersion ────────────────────────────────────────
/**
 * Bir replik satırı için tek bir kayıt versiyonu.
 * Sanatçı her yeni kayıt yüklediğinde yeni bir versiyon oluşur.
 * Önceki versiyonlar korunur — retake geçmişi burada tutulur.
 *
 * Gerçek sistemde: ayrı `recording_versions` tablosu.
 */
export interface RecordingVersion {
  version: number;          // 1, 2, 3, ... (artan)
  file: AudioFile;          // Bu versiyonun dosyası
  uploadedAt: string;       // ISO string
  uploadedBy: string;       // artistId
  // QC kararı bu versiyon için
  qcStatus?: 'pending' | 'approved' | 'rejected';
  qcNote?: string;
  reviewedBy?: string;      // QC kullanıcısı adı
  reviewedAt?: string;      // ISO string
}

// ─── RecordingLine ────────────────────────────────────────────
/**
 * Bir görev içindeki tek bir replik/satır.
 * Her biri bağımsız bir kayıt işi temsil eder.
 *
 * Versiyonlama: sanatçı yeni kayıt yüklediğinde `versions[]`'a eklenir,
 * `recordedFile` her zaman en son versiyonu gösterir.
 */
export interface RecordingLine {
  id: string;
  taskId: string;
  lineNumber: number;         // Sıralı replik numarası (1-indexed)
  originalText?: string;      // Orijinal diyalog metni
  translatedText?: string;    // Türkçe çeviri
  timecode?: string;          // "00:01:23:15" — video referans noktası
  status: LineStatus;

  // Ses dosyaları
  sourceFile?: AudioFile;     // Orijinal ses (PM/Dev yükledi)
  recordedFile?: AudioFile;   // Sanatçının EN SON kaydı (versions[]'ın son elemanı)

  // Versiyon geçmişi — retake takibi
  versions?: RecordingVersion[];  // Tüm kayıt versiyonları, sıralı

  // Notlar
  directorNote?: string;      // Yönetmen / PM notu
  artistNote?: string;        // Sanatçı notu (yükleme sırasında yazılır)

  // QC — en son QC kararı
  qcNote?: string;            // QC inceleme notu (sanatçıya gösterilebilir)
  reviewedBy?: string;        // QC kullanıcısının adı
  reviewedAt?: string;        // QC kararının zamanı (ISO string)

  // Retake tracking
  retakeCount: number;        // Kaç kez tekrar istenildi (otomatik artar)

  // Meta
  createdAt: string;
  updatedAt: string;
}

// ─── Task (Kayıt Görevi) ─────────────────────────────────────
export interface Task {
  id: string;
  projectId: string;
  characterId: string;
  characterName: string;
  assignedTo?: string;          // userId (voice artist)
  assignedArtistName?: string;
  lineCount: number;            // lines.length ile sync tutulur
  status: TaskStatus;
  sourceFiles: AudioFile[];     // Task-level kaynak dosyalar
  recordedFiles: AudioFile[];   // Task-level kayıt dosyaları
  lines: RecordingLine[];       // Bireysel replik görevleri
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

// ─── Auth ─────────────────────────────────────────────────────
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
    'users:manage',
    'settings:read', 'settings:write',
  ],
  project_manager: [
    'projects:read', 'projects:write',
    'tasks:read', 'tasks:write',
    'qc:read',
    'settings:read',
  ],
  voice_artist: [
    'tasks:read', 'tasks:upload',
    'settings:read',
  ],
  qc_reviewer: [
    'projects:read',
    'tasks:read',
    'qc:read', 'qc:approve',
    'settings:read',
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
  /** Gerçek File nesnesi — mimeType, size, name, arrayBuffer() erişimi */
  file: File;
  uid: string;
  baseName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;           // file.type — gerçek sistemde zorunlu
  previewUrl: string;         // Object URL — revokeObjectURL ile temizlenmeli
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

// ─── Filtering & Search ───────────────────────────────────────
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

// ─── QC ───────────────────────────────────────────────────────
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
  // Versiyon bilgisi — QC hangi versiyonu inceliyor
  currentVersion?: number;
  totalVersions?: number;
  qcStatus: QCStatus;
  qcNote?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  submittedAt: string;
}

// ─── Settings ─────────────────────────────────────────────────
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

// ─── Progress ─────────────────────────────────────────────────
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
