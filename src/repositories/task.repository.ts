// ============================================================
// TASK REPOSITORY — Phase 3 (Versiyonlama eklendi)
// Recording line ve task düzeyinde veri erişim katmanı.
//
// Gerçek sistemde:
//   GET  /api/tasks?projectId=:id
//   GET  /api/tasks/:id
//   PATCH /api/tasks/:id
//   POST  /api/lines
//   PATCH /api/lines/:id
//   POST  /api/lines/:id/versions    ← yeni versiyon yükleme
//   POST  /api/qc/:lineId/decision
// ============================================================

import type {
  Task,
  RecordingLine,
  RecordingVersion,
  AudioFile,
  AudioFileType,
  MyTask,
} from '../types';
import { projectRepository } from './project.repository';
import { genId, now, createLogger, MOCK_DELAY } from './base.repository';
import { mockDelay } from '../lib/http';
import { NotFoundError } from '../lib/errors';

const log = createLogger('TaskRepository');

// ─── Task status hesaplayıcı ─────────────────────────────────

/**
 * Replik durumlarından task-level status türetir.
 * QC ayarları `applyQCDecision`'da ayrıca uygulanır.
 */
function computeTaskStatus(lines: RecordingLine[]): Task['status'] {
  if (lines.length === 0) return 'pending';
  const total    = lines.length;
  const approved = lines.filter((l) => l.status === 'approved').length;
  const recorded = lines.filter((l) => l.status === 'recorded').length;
  const rejected = lines.filter((l) => l.status === 'rejected').length;

  if (approved === total)         return 'qc_approved';
  if (rejected > 0)               return 'qc_rejected';
  if (recorded > 0 || approved > 0) return 'in_progress';
  return 'pending';
}

// ─── Repository ──────────────────────────────────────────────

export const taskRepository = {

  async findByProject(projectId: string): Promise<Task[]> {
    await mockDelay(MOCK_DELAY.short);
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Proje', projectId);
    return (project.tasks ?? []).map((t) => ({
      ...t,
      lines: (t.lines ?? []).map((l) => ({ ...l })),
      sourceFiles: [...(t.sourceFiles ?? [])],
      recordedFiles: [...(t.recordedFiles ?? [])],
    }));
  },

  async findById(projectId: string, taskId: string): Promise<Task | null> {
    await mockDelay(MOCK_DELAY.short);
    const project = await projectRepository.findById(projectId);
    if (!project) return null;
    const task = (project.tasks ?? []).find((t) => t.id === taskId);
    if (!task) return null;
    return {
      ...task,
      lines: (task.lines ?? []).map((l) => ({ ...l })),
      sourceFiles: [...(task.sourceFiles ?? [])],
      recordedFiles: [...(task.recordedFiles ?? [])],
    };
  },

  /**
   * Sanatçıya atanmış görevler — proje+karakter bilgisiyle zenginleştirilmiş.
   * Gerçek sistemde: GET /api/tasks?assignedTo=:artistId&include=project,character
   */
  async findByArtist(artistId: string): Promise<MyTask[]> {
    await mockDelay(MOCK_DELAY.normal);
    const projects = await projectRepository.findAll();
    const result: MyTask[] = [];

    for (const project of projects) {
      for (const task of project.tasks ?? []) {
        if (task.assignedTo !== artistId) continue;
        const character = project.characters.find((c) => c.id === task.characterId);
        result.push({
          ...task,
          lines: (task.lines ?? []).map((l) => ({ ...l })),
          sourceFiles: [...(task.sourceFiles ?? [])],
          recordedFiles: [...(task.recordedFiles ?? [])],
          projectTitle: project.title,
          projectColor: project.coverColor ?? '#6B7280',
          clientName: project.clientName,
          characterDescription: character?.description,
          voiceNotes: character?.voiceNotes,
          characterGender: character?.gender,
          characterPriority: character?.priority,
        });
      }
    }

    const PRIORITY_WEIGHT: Record<string, number> = {
      critical: 0, high: 1, normal: 2, low: 3,
    };

    return result.sort((a, b) => {
      const pa = PRIORITY_WEIGHT[a.characterPriority ?? 'normal'] ?? 2;
      const pb = PRIORITY_WEIGHT[b.characterPriority ?? 'normal'] ?? 2;
      if (pa !== pb) return pa - pb;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  async update(
    projectId: string,
    taskId: string,
    data: Partial<Task>
  ): Promise<Task | null> {
    await mockDelay(MOCK_DELAY.normal);
    const ts = now();
    let updated: Task | null = null;

    projectRepository._updateStore(projectId, (p) => {
      const tasks = (p.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t;
        updated = { ...t, ...data, updatedAt: ts };
        return updated as Task;
      });
      return { ...p, tasks, updatedAt: ts };
    });

    log.info('update', { taskId, fields: Object.keys(data) });
    return updated;
  },

  // ─── Recording Lines ───────────────────────────────────────

  async addLine(
    projectId: string,
    taskId: string,
    data: Omit<RecordingLine, 'id' | 'taskId' | 'retakeCount' | 'createdAt' | 'updatedAt'>
  ): Promise<RecordingLine | null> {
    await mockDelay(MOCK_DELAY.normal);
    const ts = now();
    let newLine: RecordingLine | null = null;

    projectRepository._updateStore(projectId, (p) => {
      const tasks = (p.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t;
        newLine = {
          ...data,
          id: genId('line'),
          taskId,
          retakeCount: 0,
          versions: [],
          createdAt: ts,
          updatedAt: ts,
        };
        const lines = [...(t.lines ?? []), newLine];
        return { ...t, lines, lineCount: lines.length, updatedAt: ts };
      });
      return { ...p, tasks };
    });

    log.info('addLine', { taskId });
    return newLine;
  },

  async updateLine(
    projectId: string,
    taskId: string,
    lineId: string,
    data: Partial<Pick<
      RecordingLine,
      'status' | 'directorNote' | 'artistNote' | 'retakeCount' |
      'recordedFile' | 'qcNote' | 'reviewedBy' | 'reviewedAt' | 'versions'
    >>
  ): Promise<RecordingLine | null> {
    await mockDelay(MOCK_DELAY.short);
    const ts = now();
    let updatedLine: RecordingLine | null = null;

    projectRepository._updateStore(projectId, (p) => {
      const tasks = (p.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t;

        const lines = (t.lines ?? []).map((l) => {
          if (l.id !== lineId) return l;
          const isRetake = data.status === 'rejected' || data.status === 'retake';
          updatedLine = {
            ...l,
            ...data,
            retakeCount: isRetake ? (l.retakeCount ?? 0) + 1 : l.retakeCount,
            updatedAt: ts,
          };
          return updatedLine as RecordingLine;
        });

        // Task status'ını replik durumlarından güncelle (QC dışı)
        const newStatus = computeTaskStatus(lines);
        return { ...t, lines, status: newStatus, updatedAt: ts };
      });
      return { ...p, tasks };
    });

    log.info('updateLine', { lineId, status: data.status });
    return updatedLine;
  },

  /**
   * Sanatçı kayıt yükledi — versiyonlama ile güncelle.
   *
   * Her yükleme yeni bir RecordingVersion oluşturur.
   * `recordedFile` → en son versiyon dosyasını gösterir.
   * `versions[]` → tam geçmiş korunur.
   *
   * Gerçek sistemde: POST /api/lines/:id/versions
   */
  async uploadLineRecording(
    projectId: string,
    taskId: string,
    lineId: string,
    file: AudioFile,
    artistNote?: string
  ): Promise<RecordingLine | null> {
    await mockDelay(MOCK_DELAY.short);
    const ts = now();
    let updatedLine: RecordingLine | null = null;

    projectRepository._updateStore(projectId, (p) => {
      const tasks = (p.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t;

        const lines = (t.lines ?? []).map((l) => {
          if (l.id !== lineId) return l;

          // Mevcut versiyonlar
          const existingVersions: RecordingVersion[] = l.versions ?? [];

          // Yeni versiyon numarası
          const newVersionNumber = existingVersions.length + 1;

          // Yeni versiyon oluştur
          const newVersion: RecordingVersion = {
            version: newVersionNumber,
            file,
            uploadedAt: ts,
            uploadedBy: file.uploadedBy,
            qcStatus: 'pending',
          };

          const versions = [...existingVersions, newVersion];

          updatedLine = {
            ...l,
            status: 'recorded',
            recordedFile: file,      // En son versiyon
            versions,                // Tam geçmiş
            artistNote: artistNote ?? l.artistNote,
            // Önceki QC kararını sıfırla — yeni kayıt geldi
            qcNote: undefined,
            reviewedBy: undefined,
            reviewedAt: undefined,
            retakeCount: l.retakeCount, // Retake sayısı applyQCDecision'da artar
            updatedAt: ts,
          };
          return updatedLine as RecordingLine;
        });

        // Task status güncelle
        const newStatus = computeTaskStatus(lines);
        return { ...t, lines, status: newStatus, updatedAt: ts };
      });

      return { ...p, tasks, updatedAt: ts };
    });

    log.info('uploadLineRecording', { lineId, version: 'new' });
    return updatedLine;
  },

  // ─── AudioFile (task-level) ────────────────────────────────

  async addAudioFile(
    projectId: string,
    taskId: string,
    file: AudioFile,
    fileType: AudioFileType
  ): Promise<Task | null> {
    await mockDelay(MOCK_DELAY.upload);
    const ts = now();
    let updatedTask: Task | null = null;

    projectRepository._updateStore(projectId, (p) => {
      const tasks = (p.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t;
        if (fileType === 'source') {
          updatedTask = {
            ...t,
            sourceFiles: [...(t.sourceFiles ?? []), file],
            updatedAt: ts,
          };
        } else {
          updatedTask = {
            ...t,
            recordedFiles: [...(t.recordedFiles ?? []), file],
            status: t.status === 'pending' || t.status === 'in_progress'
              ? 'uploaded' : t.status,
            updatedAt: ts,
          };
        }
        return updatedTask as Task;
      });
      return { ...p, tasks, updatedAt: ts };
    });

    return updatedTask;
  },

  /**
   * Toplu kaynak ses yükleme.
   * Her dosya için RecordingLine oluşturur.
   * lineCount, character.lineCount ve task.status otomatik güncellenir.
   */
  async bulkAddSourceFiles(
    projectId: string,
    taskId: string,
    audioFiles: AudioFile[]
  ): Promise<Task | null> {
    await mockDelay(MOCK_DELAY.short);
    const ts = now();
    let updatedTask: Task | null = null;

    projectRepository._updateStore(projectId, (p) => {
      const tasks = (p.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t;
        const existingCount = (t.lines ?? []).length;

        const newLines: RecordingLine[] = audioFiles.map((af, i) => ({
          id: genId('line'),
          taskId,
          lineNumber: existingCount + i + 1,
          status: 'pending' as const,
          sourceFile: af,
          retakeCount: 0,
          versions: [],
          createdAt: ts,
          updatedAt: ts,
        }));

        const allLines = [...(t.lines ?? []), ...newLines];
        updatedTask = {
          ...t,
          lines: allLines,
          sourceFiles: [...(t.sourceFiles ?? []), ...audioFiles],
          lineCount: allLines.length,         // lines.length ile sync
          status: t.status === 'pending' ? 'in_progress' : t.status,
          updatedAt: ts,
        };
        return updatedTask as Task;
      });

      // Character lineCount'unu da güncelle
      const characters = (p.characters ?? []).map((c) => {
        if (c.taskId !== taskId) return c;
        return {
          ...c,
          lineCount: updatedTask?.lineCount ?? c.lineCount,
          updatedAt: ts,
        };
      });

      return { ...p, tasks, characters, updatedAt: ts };
    });

    log.info('bulkAddSourceFiles', { taskId, count: audioFiles.length });
    return updatedTask;
  },

  /** Replik durumlarından task status'ını senkronize et */
  async syncStatus(projectId: string, taskId: string): Promise<Task | null> {
    await mockDelay(MOCK_DELAY.short);
    const task = await this.findById(projectId, taskId);
    if (!task || (task.lines ?? []).length === 0) return task;

    const newStatus = computeTaskStatus(task.lines ?? []);
    if (newStatus === task.status) return task;

    return this.update(projectId, taskId, { status: newStatus });
  },

  /**
   * QC kararını merkezi veri katmanına yaz.
   *
   * Güncellenenler:
   *   - line.status (approved/rejected)
   *   - line.qcNote, reviewedBy, reviewedAt
   *   - line.retakeCount (rejected'da +1)
   *   - line.versions[son].qcStatus (en son versiyon için QC kararı)
   *   - task.status (qcSettings'den autoStatus veya computeTaskStatus)
   *   - character.completedCount (approved satır sayısı)
   *
   * Gerçek sistemde: POST /api/qc/:lineId/decision
   */
  async applyQCDecision(
    projectId: string,
    taskId: string,
    lineId: string,
    decision: 'approved' | 'rejected',
    note: string,
    reviewerName: string,
    qcSettings?: { autoStatusOnApprove: string; autoStatusOnReject: string }
  ): Promise<{ line: RecordingLine; task: Task } | null> {
    await mockDelay(MOCK_DELAY.short);
    const ts = now();
    let updatedLine: RecordingLine | null = null;
    let updatedTask: Task | null = null;

    projectRepository._updateStore(projectId, (p) => {
      const tasks = (p.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t;

        const lines = (t.lines ?? []).map((l) => {
          if (l.id !== lineId) return l;

          // En son versiyona QC kararını yaz
          const versions = (l.versions ?? []).map((v, idx, arr) => {
            if (idx !== arr.length - 1) return v; // Sadece son versiyon
            return {
              ...v,
              qcStatus: decision === 'approved' ? 'approved' as const : 'rejected' as const,
              qcNote: note || undefined,
              reviewedBy: reviewerName,
              reviewedAt: ts,
            };
          });

          updatedLine = {
            ...l,
            status: decision === 'approved' ? 'approved' : 'rejected',
            qcNote: note || l.qcNote,
            reviewedBy: reviewerName,
            reviewedAt: ts,
            retakeCount: decision === 'rejected'
              ? (l.retakeCount ?? 0) + 1
              : l.retakeCount,
            versions,
            updatedAt: ts,
          };
          return updatedLine as RecordingLine;
        });

        // Task status — qcSettings varsa kullan, yoksa otomatik hesapla
        let newTaskStatus = computeTaskStatus(lines);
        if (qcSettings) {
          const allApproved = lines.every((l) => l.status === 'approved');
          const anyRejected = lines.some((l) => l.status === 'rejected');
          if (allApproved && qcSettings.autoStatusOnApprove) {
            newTaskStatus = qcSettings.autoStatusOnApprove as Task['status'];
          } else if (anyRejected && qcSettings.autoStatusOnReject) {
            newTaskStatus = qcSettings.autoStatusOnReject as Task['status'];
          }
        }

        updatedTask = { ...t, lines, status: newTaskStatus, updatedAt: ts };
        return updatedTask as Task;
      });

      // Character completedCount güncelle
      const characters = (p.characters ?? []).map((c) => {
        const relatedTask = tasks.find((t) => t.characterId === c.id);
        if (!relatedTask) return c;
        const completed = (relatedTask.lines ?? []).filter(
          (l) => l.status === 'approved'
        ).length;
        return { ...c, completedCount: completed, updatedAt: ts };
      });

      log.info('applyQCDecision', { lineId, decision, reviewer: reviewerName });
      return { ...p, tasks, characters, updatedAt: ts };
    });

    if (!updatedLine || !updatedTask) return null;
    return { line: updatedLine, task: updatedTask };
  },
};
