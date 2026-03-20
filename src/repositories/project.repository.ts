// ============================================================
// PROJECT REPOSITORY
// Proje CRUD işlemleri için veri erişim katmanı.
// Şu an in-memory store kullanıyor.
// Gerçek sistemde: Supabase / Prisma / REST API çağrısı buraya gelir.
// ============================================================

import { MOCK_PROJECTS } from '../mock';
import type { Project, ProjectFormData } from '../types';
import { genId, now, createLogger, MOCK_DELAY } from './base.repository';
import { mockDelay } from '../lib/http';
import { NotFoundError } from '../lib/errors';

const log = createLogger('ProjectRepository');

// ─── In-memory store ─────────────────────────────────────────
// Gerçek sistemde bu katman tamamen kaldırılır.
let _store: Project[] = [...MOCK_PROJECTS];

/** Test/dev ortamında store'u sıfırla */
export function resetProjectStore(): void {
  _store = [...MOCK_PROJECTS];
}

/** Store'un güncel snapshot'ını al (deep copy) */
export function getProjectStore(): Project[] {
  return _store.map((p) => ({ ...p }));
}

// ─── Repository ──────────────────────────────────────────────

export const projectRepository = {

  async findAll(): Promise<Project[]> {
    await mockDelay(MOCK_DELAY.normal);
    log.debug('findAll', { count: _store.length });
    return _store.map((p) => ({
      ...p,
      characters: p.characters.map((c) => ({ ...c })),
      tasks: p.tasks.map((t) => ({
        ...t,
        lines: (t.lines ?? []).map((l) => ({ ...l })),
        sourceFiles: [...(t.sourceFiles ?? [])],
        recordedFiles: [...(t.recordedFiles ?? [])],
      })),
    }));
  },

  async findById(id: string): Promise<Project | null> {
    await mockDelay(MOCK_DELAY.short);
    const project = _store.find((p) => p.id === id);
    if (!project) {
      log.warn('findById — not found', { id });
      return null;
    }
    return {
      ...project,
      characters: project.characters.map((c) => ({ ...c })),
      tasks: project.tasks.map((t) => ({
        ...t,
        lines: (t.lines ?? []).map((l) => ({ ...l })),
        sourceFiles: [...(t.sourceFiles ?? [])],
        recordedFiles: [...(t.recordedFiles ?? [])],
      })),
    };
  },

  async create(data: ProjectFormData): Promise<Project> {
    await mockDelay(MOCK_DELAY.long);
    const ts = now();
    const project: Project = {
      ...data,
      id: genId('proj'),
      characters: [],
      tasks: [],
      createdAt: ts,
      updatedAt: ts,
    };
    _store = [project, ..._store];
    log.info('create', { id: project.id, title: project.title });
    return { ...project };
  },

  async update(id: string, data: Partial<ProjectFormData>): Promise<Project | null> {
    await mockDelay(MOCK_DELAY.normal);
    const idx = _store.findIndex((p) => p.id === id);
    if (idx === -1) {
      log.warn('update — not found', { id });
      return null;
    }
    _store[idx] = { ..._store[idx], ...data, updatedAt: now() };
    log.info('update', { id });
    return { ..._store[idx] };
  },

  async delete(id: string): Promise<boolean> {
    await mockDelay(MOCK_DELAY.normal);
    const before = _store.length;
    _store = _store.filter((p) => p.id !== id);
    const deleted = _store.length < before;
    log.info('delete', { id, deleted });
    return deleted;
  },

  // ─── İç mutasyon yardımcıları (diğer repository'ler kullanır) ──

  /** Proje store'unu doğrudan güncelle (alt repository'ler için) */
  _updateStore(id: string, updater: (p: Project) => Project): Project | null {
    const idx = _store.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    _store[idx] = updater(_store[idx]);
    return { ..._store[idx] };
  },

  /** Proje bulunamazsa NotFoundError fırlat */
  _getOrThrow(id: string): { project: Project; idx: number } {
    const idx = _store.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundError('Proje', id);
    return { project: _store[idx], idx };
  },
};
