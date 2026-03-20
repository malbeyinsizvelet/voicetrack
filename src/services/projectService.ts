import { projectRepository } from '../repositories/project.repository';
import { characterRepository } from '../repositories/character.repository';
import { taskRepository } from '../repositories/task.repository';
import { createLogger } from '../lib/logger';
import type { Project, Character, Task, RecordingLine, AudioFile, AudioFileType, ProjectFormData, CharacterFormData, MyTask, AssignArtistPayload } from '../types';

export type { RecordingLine, AudioFile, AudioFileType };

const log = createLogger('ProjectService');

export const projectService = {
  async getAll(): Promise<Project[]> { return projectRepository.findAll(); },
  async getById(id: string): Promise<Project | null> { return projectRepository.findById(id); },
  async create(data: ProjectFormData): Promise<Project> { log.info('Creating project', { title: data.title }); return projectRepository.create(data); },
  async update(id: string, data: Partial<ProjectFormData>): Promise<Project | null> { log.info('Updating project', { id }); return projectRepository.update(id, data); },
  async delete(id: string): Promise<boolean> { log.info('Deleting project', { id }); return projectRepository.delete(id); },

  async addCharacter(projectId: string, data: CharacterFormData): Promise<{ character: Character; task: Task }> { log.info('Adding character', { projectId, name: data.name }); return characterRepository.create(projectId, data); },
  async updateCharacter(projectId: string, characterId: string, data: Partial<CharacterFormData>): Promise<Character | null> { return characterRepository.update(projectId, characterId, data); },
  async deleteCharacter(projectId: string, characterId: string): Promise<boolean> { return characterRepository.delete(projectId, characterId); },
  async assignArtist(projectId: string, characterId: string, payload: AssignArtistPayload): Promise<Character | null> { log.info('Assigning artist', { projectId, characterId, artistId: payload.artistId }); return characterRepository.assignArtist(projectId, characterId, payload); },

  async getTasksByArtist(artistId: string): Promise<MyTask[]> { return taskRepository.findByArtist(artistId); },
  async getProjectsByArtist(artistId: string): Promise<Project[]> { const all = await projectRepository.findAll(); return all.filter((p) => p.tasks.some((t) => t.assignedTo === artistId)); },

  async updateTask(projectId: string, taskId: string, data: Partial<Task>): Promise<Task | null> { return taskRepository.update(projectId, taskId, data); },
  async syncTaskStatus(projectId: string, taskId: string): Promise<Task | null> { return taskRepository.syncStatus(projectId, taskId); },

  async addLine(projectId: string, taskId: string, data: Omit<RecordingLine, 'id' | 'taskId' | 'retakeCount' | 'createdAt' | 'updatedAt'>): Promise<RecordingLine | null> { return taskRepository.addLine(projectId, taskId, data); },
  async updateLine(projectId: string, taskId: string, lineId: string, data: Partial<Pick<RecordingLine, 'status' | 'directorNote' | 'artistNote' | 'retakeCount' | 'recordedFile'>>): Promise<RecordingLine | null> { return taskRepository.updateLine(projectId, taskId, lineId, data); },
  async uploadLineRecording(projectId: string, taskId: string, lineId: string, file: AudioFile, artistNote?: string): Promise<RecordingLine | null> { log.info('Uploading recording', { taskId, lineId }); return taskRepository.uploadLineRecording(projectId, taskId, lineId, file, artistNote); },

  async addAudioFile(projectId: string, taskId: string, file: AudioFile, fileType: AudioFileType): Promise<Task | null> { return taskRepository.addAudioFile(projectId, taskId, file, fileType); },
  async bulkAddSourceFiles(projectId: string, taskId: string, audioFiles: AudioFile[]): Promise<Task | null> { log.info('Bulk adding source files', { taskId, count: audioFiles.length }); return taskRepository.bulkAddSourceFiles(projectId, taskId, audioFiles); },

  async applyQCDecision(projectId: string, taskId: string, lineId: string, decision: 'approved' | 'rejected', note: string, reviewerName: string, qcSettings?: { autoStatusOnApprove: string; autoStatusOnReject: string }): Promise<{ line: RecordingLine; task: Task } | null> {
    log.info('QC decision', { lineId, decision, reviewerName });
    return taskRepository.applyQCDecision(projectId, taskId, lineId, decision, note, reviewerName, qcSettings);
  },
};
