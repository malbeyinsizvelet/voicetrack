import type { Character, Task, CharacterFormData, AssignArtistPayload } from '../types';
import { projectRepository } from './project.repository';
import { genId, now, createLogger, MOCK_DELAY } from './base.repository';
import { mockDelay } from '../lib/http';
import { NotFoundError } from '../lib/errors';

const log = createLogger('CharacterRepository');

export const characterRepository = {
  async findByProject(projectId: string): Promise<Character[]> {
    await mockDelay(MOCK_DELAY.short);
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Proje', projectId);
    return [...project.characters];
  },

  async create(projectId: string, data: CharacterFormData): Promise<{ character: Character; task: Task }> {
    await mockDelay(MOCK_DELAY.normal);
    const { project, idx } = projectRepository._getOrThrow(projectId);
    const ts = now();
    const charId = genId('ch');
    const taskId = genId('task');
    const nextOrder = (project.characters.length) + 1;

    const character: Character = { ...data, id: charId, projectId, taskId, lineCount: data.lineCount ?? 0, completedCount: data.completedCount ?? 0, order: data.order ?? nextOrder, createdAt: ts, updatedAt: ts };
    const task: Task = { id: taskId, projectId, characterId: charId, characterName: data.name, assignedTo: data.assignedArtistId ?? '', assignedArtistName: data.assignedArtistName ?? 'Atanmamış', lineCount: data.lineCount ?? 0, status: 'pending', sourceFiles: [], recordedFiles: [], lines: [], createdAt: ts, updatedAt: ts };

    projectRepository._updateStore(projectId, (p) => ({ ...p, characters: [...p.characters, character], tasks: [...p.tasks, task], updatedAt: ts }));
    log.info('create', { projectId, charId, name: data.name });
    void idx;
    return { character: { ...character }, task: { ...task } };
  },

  async update(projectId: string, characterId: string, data: Partial<CharacterFormData>): Promise<Character | null> {
    await mockDelay(MOCK_DELAY.normal);
    const { project } = projectRepository._getOrThrow(projectId);
    const ts = now();
    const charIdx = project.characters.findIndex((c) => c.id === characterId);
    if (charIdx === -1) { log.warn('update — character not found', { projectId, characterId }); return null; }

    const oldChar = project.characters[charIdx];
    const updated: Character = { ...oldChar, ...data, updatedAt: ts };

    projectRepository._updateStore(projectId, (p) => {
      const tasks = p.tasks.map((t) => {
        if (t.id !== oldChar.taskId) return t;
        return { ...t, ...(data.lineCount !== undefined ? { lineCount: data.lineCount } : {}), ...(data.assignedArtistId !== undefined ? { assignedTo: data.assignedArtistId } : {}), ...(data.assignedArtistName !== undefined ? { assignedArtistName: data.assignedArtistName } : {}), updatedAt: ts };
      });
      return { ...p, characters: p.characters.map((c) => (c.id === characterId ? updated : c)), tasks, updatedAt: ts };
    });

    log.info('update', { characterId, fields: Object.keys(data) });
    return { ...updated };
  },

  async delete(projectId: string, characterId: string): Promise<boolean> {
    await mockDelay(MOCK_DELAY.normal);
    const { project } = projectRepository._getOrThrow(projectId);
    const char = project.characters.find((c) => c.id === characterId);
    if (!char) return false;
    projectRepository._updateStore(projectId, (p) => ({ ...p, characters: p.characters.filter((c) => c.id !== characterId), tasks: p.tasks.filter((t) => t.id !== char.taskId), updatedAt: now() }));
    log.info('delete', { projectId, characterId });
    return true;
  },

  async assignArtist(projectId: string, characterId: string, payload: AssignArtistPayload): Promise<Character | null> {
    return this.update(projectId, characterId, { assignedArtistId: payload.artistId, assignedArtistName: payload.artistName });
  },
};
