// ============================================================
// SERVICES BARREL
// Tüm servisler buradan export edilir.
// Bileşenler ve context'ler servis adını bilir, dosya yolunu bilmez.
// ============================================================

export { projectService } from './projectService';
export { authService } from './authService';
export { audioService } from './audioService';

// progressService — named function exports
export {
  computeCastProgress,
  computeProjectProgress,
  computeOverallProgress,
  progressToColorClass,
  formatLineCount,
  countCompletedLines,
  countRecordedLines,
  countPendingLines,
  countRejectedLines,
} from './progressService';

// filterService — named function exports
export {
  DEFAULT_TASK_FILTER,
  DEFAULT_LINE_FILTER,
  filterTasks,
  filterMyTasks,
  filterLines,
  searchTasks,
  countActiveFilters,
  countUploaded,
  countPending,
  taskProgressPercent,
} from './filterService';

// downloadService — named function exports
export {
  downloadSourceFile,
  downloadRecordedFile,
  downloadFile,
  canDownloadSource,
  canDownloadRecorded,
  getUnavailableReason,
} from './downloadService';

// audioUploadService — named function exports
export {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
  getExtension,
  getBaseName,
  formatFileSize,
  validateAudioFile,
  buildUploadEntries,
  mockUploadOne,
  extractAudioFiles,
  extractFilesFromDataTransfer,
  uploadRecordedFile,
  mockDownloadSourceFile,
  revokeEntryUrls,
} from './audioUploadService';
