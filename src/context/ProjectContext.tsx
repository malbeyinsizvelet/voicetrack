// ============================================================
// PROJECT CONTEXT — Phase 3
// Proje CRUD + karakter yönetimi global state.
// Gerçek API'ye geçişte sadece servis çağrıları değişir.
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type {
  Project,
  Character,
  Task,
  RecordingLine,
  AudioFile,
  AudioFileType,
  ProjectFormData,
  CharacterFormData,
  AssignArtistPayload,
} from '../types';
import { projectService } from '../services/projectService';
import { useSettings } from './SettingsContext';

interface ProjectContextValue {
  // State
  projects: Project[];
  isLoading: boolean;
  selectedProjectId: string | null;

  // Navigation
  setSelectedProjectId: (id: string | null) => void;

  // Queries
  getProject: (id: string) => Project | undefined;
  refreshProjects: () => Promise<void>;

  // Project CRUD
  addProject: (data: ProjectFormData) => Promise<Project>;
  updateProject: (id: string, data: Partial<ProjectFormData>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;

  // Character CRUD
  addCharacter: (
    projectId: string,
    data: CharacterFormData
  ) => Promise<{ character: Character; task: Task }>;
  updateCharacter: (
    projectId: string,
    characterId: string,
    data: Partial<CharacterFormData>
  ) => Promise<Character | null>;
  deleteCharacter: (projectId: string, characterId: string) => Promise<boolean>;

  // Artist assignment
  assignArtist: (
    projectId: string,
    characterId: string,
    payload: AssignArtistPayload
  ) => Promise<Character | null>;

  // Recording Lines
  addLine: (
    projectId: string,
    taskId: string,
    data: Omit<RecordingLine, 'id' | 'taskId' | 'retakeCount' | 'createdAt' | 'updatedAt'>
  ) => Promise<RecordingLine | null>;

  updateLine: (
    projectId: string,
    taskId: string,
    lineId: string,
    data: Partial<Pick<RecordingLine, 'status' | 'directorNote' | 'artistNote' | 'retakeCount' | 'recordedFile' | 'qcNote' | 'reviewedBy' | 'reviewedAt'>>
  ) => Promise<RecordingLine | null>;

  addAudioFile: (
    projectId: string,
    taskId: string,
    file: AudioFile,
    fileType: AudioFileType
  ) => Promise<Task | null>;

  // Bulk upload: birden fazla kaynak ses dosyası ekle, her biri için RecordingLine oluştur
  bulkUploadSourceFiles: (
    projectId: string,
    taskId: string,
    audioFiles: AudioFile[]
  ) => Promise<Task | null>;

  // Sanatçı kayıt yükleme: versiyonlama ile line güncelle
  uploadRecording: (
    projectId: string,
    taskId: string,
    lineId: string,
    file: AudioFile,
    artistNote?: string
  ) => Promise<RecordingLine | null>;

  // Task status'ını satır durumlarına göre otomatik güncelle
  syncTaskStatus: (
    projectId: string,
    taskId: string
  ) => Promise<Task | null>;

  // QC kararını merkezi state'e yaz — tüm sayfalara yansır
  applyQCDecision: (
    projectId: string,
    taskId: string,
    lineId: string,
    decision: 'approved' | 'rejected',
    note: string,
    reviewerName: string
  ) => Promise<{ line: RecordingLine; task: Task } | null>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { settings } = useSettings();

  // ── Fetch ────────────────────────────────────────────────
  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    const data = await projectService.getAll();
    setProjects(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const getProject = (id: string) => projects.find((p) => p.id === id);

  // ── Project CRUD ─────────────────────────────────────────
  const addProject = useCallback(async (data: ProjectFormData): Promise<Project> => {
    const created = await projectService.create(data);
    setProjects((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateProject = useCallback(
    async (id: string, data: Partial<ProjectFormData>): Promise<Project | null> => {
      const updated = await projectService.update(id, data);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
      return updated;
    },
    []
  );

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    const ok = await projectService.delete(id);
    if (ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjectId === id) setSelectedProjectId(null);
    }
    return ok;
  }, [selectedProjectId]);

  // ── Character CRUD ───────────────────────────────────────
  const addCharacter = useCallback(
    async (
      projectId: string,
      data: CharacterFormData
    ): Promise<{ character: Character; task: Task }> => {
      const result = await projectService.addCharacter(projectId, data);
      // Projeyi local state'te de güncelle
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            characters: [...p.characters, result.character],
            tasks: [...p.tasks, result.task],
            updatedAt: new Date().toISOString(),
          };
        })
      );
      return result;
    },
    []
  );

  const updateCharacter = useCallback(
    async (
      projectId: string,
      characterId: string,
      data: Partial<CharacterFormData>
    ): Promise<Character | null> => {
      const updated = await projectService.updateCharacter(projectId, characterId, data);
      if (updated) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              characters: p.characters.map((c) => (c.id === characterId ? updated : c)),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
      return updated;
    },
    []
  );

  // ── Artist Assignment ─────────────────────────────────────
  const assignArtist = useCallback(
    async (
      projectId: string,
      characterId: string,
      payload: AssignArtistPayload
    ): Promise<Character | null> => {
      const updated = await projectService.assignArtist(projectId, characterId, payload);
      if (updated) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              characters: p.characters.map((c) => (c.id === characterId ? updated : c)),
              // Task'ı da güncelle
              tasks: p.tasks.map((t) =>
                t.characterId === characterId
                  ? {
                      ...t,
                      assignedTo: payload.artistId,
                      assignedArtistName: payload.artistName,
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
      return updated;
    },
    []
  );

  const deleteCharacter = useCallback(
    async (projectId: string, characterId: string): Promise<boolean> => {
      const ok = await projectService.deleteCharacter(projectId, characterId);
      if (ok) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            const char = p.characters.find((c) => c.id === characterId);
            return {
              ...p,
              characters: p.characters.filter((c) => c.id !== characterId),
              tasks: p.tasks.filter((t) => t.id !== char?.taskId),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
      return ok;
    },
    []
  );

  // ── Recording Lines ───────────────────────────────────────
  const addLine = useCallback(
    async (
      projectId: string,
      taskId: string,
      data: Omit<RecordingLine, 'id' | 'taskId' | 'retakeCount' | 'createdAt' | 'updatedAt'>
    ): Promise<RecordingLine | null> => {
      const newLine = await projectService.addLine(projectId, taskId, data);
      if (newLine) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, lines: [...t.lines, newLine], lineCount: t.lines.length + 1 }
                  : t
              ),
            };
          })
        );
      }
      return newLine;
    },
    []
  );

  const updateLine = useCallback(
    async (
      projectId: string,
      taskId: string,
      lineId: string,
      data: Partial<Pick<RecordingLine, 'status' | 'directorNote' | 'artistNote' | 'retakeCount' | 'recordedFile' | 'qcNote' | 'reviewedBy' | 'reviewedAt'>>
    ): Promise<RecordingLine | null> => {
      const updated = await projectService.updateLine(projectId, taskId, lineId, data);
      if (updated) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      lines: t.lines.map((l) => (l.id === lineId ? updated : l)),
                      updatedAt: new Date().toISOString(),
                    }
                  : t
              ),
            };
          })
        );
      }
      return updated;
    },
    []
  );

  const addAudioFile = useCallback(
    async (
      projectId: string,
      taskId: string,
      file: AudioFile,
      fileType: AudioFileType
    ): Promise<Task | null> => {
      const updatedTask = await projectService.addAudioFile(projectId, taskId, file, fileType);
      if (updatedTask) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
      return updatedTask;
    },
    []
  );

  const bulkUploadSourceFiles = useCallback(
    async (
      projectId: string,
      taskId: string,
      audioFiles: AudioFile[]
    ): Promise<Task | null> => {
      const updatedTask = await projectService.bulkAddSourceFiles(projectId, taskId, audioFiles);
      if (updatedTask) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              characters: p.characters.map((c) =>
                c.taskId === taskId
                  ? { ...c, lineCount: updatedTask.lineCount, updatedAt: new Date().toISOString() }
                  : c
              ),
              tasks: p.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
      return updatedTask;
    },
    []
  );

  // ── Artist Upload ─────────────────────────────────────────
  const uploadRecording = useCallback(
    async (
      projectId: string,
      taskId: string,
      lineId: string,
      file: AudioFile,
      artistNote?: string
    ): Promise<RecordingLine | null> => {
      const updated = await projectService.uploadLineRecording(projectId, taskId, lineId, file, artistNote);
      if (updated) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) => {
                if (t.id !== taskId) return t;
                const updatedLines = t.lines.map((l) => (l.id === lineId ? updated : l));
                // completedCount: recorded + approved satırlar
                const doneLines = updatedLines.filter(
                  (l) => l.status === 'recorded' || l.status === 'approved'
                ).length;
                return {
                  ...t,
                  lines: updatedLines,
                  // Durum: en az 1 kayıt varsa in_progress, hepsi yüklendiyse uploaded
                  status: (
                    t.status === 'pending' ? 'in_progress'
                    : doneLines === updatedLines.length && updatedLines.length > 0 ? 'uploaded'
                    : t.status
                  ) as Task['status'],
                  updatedAt: new Date().toISOString(),
                };
              }),
              // Karakter completedCount'u da güncelle
              characters: p.characters.map((c) => {
                if (c.taskId !== taskId) return c;
                const task = p.tasks.find((t) => t.id === taskId);
                if (!task) return c;
                const newCompleted = task.lines.filter(
                  (l) => l.status === 'recorded' || l.status === 'approved'
                ).length + 1; // +1 yeni yüklenen
                return { ...c, completedCount: newCompleted, updatedAt: new Date().toISOString() };
              }),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
      return updated;
    },
    []
  );

  const syncTaskStatus = useCallback(
    async (projectId: string, taskId: string): Promise<Task | null> => {
      const updated = await projectService.syncTaskStatus(projectId, taskId);
      if (updated) {
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? updated : t)),
            };
          })
        );
      }
      return updated;
    },
    []
  );

  // ── QC Decision ───────────────────────────────────────────
  /**
   * QC kararını repository üzerinden yazar → setProjects tetiklenir
   * → MyTasks, ProjectDetail, QCReview sayfalarının tümü güncellenir.
   */
  const applyQCDecision = useCallback(
    async (
      projectId: string,
      taskId: string,
      lineId: string,
      decision: 'approved' | 'rejected',
      note: string,
      reviewerName: string
    ): Promise<{ line: RecordingLine; task: Task } | null> => {
      const result = await projectService.applyQCDecision(
        projectId, taskId, lineId, decision, note, reviewerName,
        {
          autoStatusOnApprove: settings.qc.autoStatusOnApprove,
          autoStatusOnReject:  settings.qc.autoStatusOnReject,
        }
      );
      if (result) {
        // Repository zaten güncelledi; React state'i de senkronize et
        setProjects((prev) =>
          prev.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? result.task : t)),
              characters: p.characters.map((c) => {
                if (c.taskId !== taskId) return c;
                const approvedCount = result.task.lines.filter(
                  (l) => l.status === 'approved'
                ).length;
                return { ...c, completedCount: approvedCount, updatedAt: new Date().toISOString() };
              }),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
      return result;
    },
    [settings.qc]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        isLoading,
        selectedProjectId,
        setSelectedProjectId,
        getProject,
        refreshProjects,
        addProject,
        updateProject,
        deleteProject,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        assignArtist,
        addLine,
        updateLine,
        addAudioFile,
        bulkUploadSourceFiles,
        uploadRecording,
        syncTaskStatus,
        applyQCDecision,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectProvider');
  return ctx;
}
