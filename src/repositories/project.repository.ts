// ============================================================
// PROJECT REPOSITORY — Supabase + Mock Fallback
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { MOCK_PROJECTS } from '../mock';
import type { Project, ProjectFormData, Character, Task } from '../types';
import { genId, now, createLogger, MOCK_DELAY } from './base.repository';
import { mockDelay } from '../lib/http';
import { NotFoundError } from '../lib/errors';

const log = createLogger('ProjectRepository');

// ─── Mock store (sadece Supabase kapalıyken) ─────────────────
let _store: Project[] = [...MOCK_PROJECTS];
export function resetProjectStore(): void { _store = [...MOCK_PROJECTS]; }
export function getProjectStore(): Project[] { return _store.map((p) => ({ ...p })); }

// ─── DB row → App type dönüşümleri ───────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbCharacterToApp(c: any): Character {
  return {
    id: c.id,
    projectId: c.project_id,
    name: c.name,
    description: c.description ?? undefined,
    voiceNotes: c.voice_notes ?? undefined,
    gender: c.gender ?? undefined,
    priority: c.priority ?? undefined,
    assignedArtistId: c.assigned_artist_id ?? undefined,
    assignedArtistName: c.assigned_artist_name ?? undefined,
    lineCount: c.line_count,
    completedCount: c.completed_count,
    order: c.order,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbTaskToApp(t: any): Task {
  return {
    id: t.id,
    projectId: t.project_id,
    characterId: t.character_id,
    characterName: t.character_name,
    assignedTo: t.assigned_to ?? undefined,
    assignedArtistName: t.assigned_artist_name ?? undefined,
    lineCount: t.line_count,
    status: t.status as Task['status'],
    notes: t.notes ?? undefined,
    dueDate: t.due_date ?? undefined,
    sourceFiles: [],
    recordedFiles: [],
    lines: [],
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbProjectToApp(p: any, characters: Character[] = [], tasks: Task[] = []): Project {
  return {
    id: p.id,
    title: p.title,
    clientName: p.client_name,
    description: p.description ?? undefined,
    status: p.status as Project['status'],
    managerId: p.manager_id ?? '',
    managerName: p.manager_name,
    dueDate: p.due_date ?? undefined,
    coverColor: p.cover_color ?? undefined,
    characters,
    tasks,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

// ─── Supabase implementasyonu ─────────────────────────────────
async function supabaseFindAll(): Promise<Project[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: projects, error } = await db.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Projects fetch failed: ${error.message}`);
  if (!projects?.length) return [];

  const projectIds = projects.map((p: any) => p.id);
  const [{ data: characters }, { data: tasks }] = await Promise.all([
    db.from('characters').select('*').in('project_id', projectIds),
    db.from('tasks').select('*').in('project_id', projectIds),
  ]);

  return projects.map((p: any) => {
    const chars = ((characters ?? []) as any[]).filter((c) => c.project_id === p.id).map(dbCharacterToApp);
    const taskList = ((tasks ?? []) as any[]).filter((t) => t.project_id === p.id).map(dbTaskToApp);
    return dbProjectToApp(p, chars, taskList);
  });
}

async function supabaseFindById(id: string): Promise<Project | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: p, error } = await db.from('projects').select('*').eq('id', id).single();
  if (error || !p) return null;

  const [{ data: characters }, { data: tasks }] = await Promise.all([
    db.from('characters').select('*').eq('project_id', id),
    db.from('tasks').select('*').eq('project_id', id),
  ]);

  const chars = ((characters ?? []) as any[]).map(dbCharacterToApp);
  const taskList = ((tasks ?? []) as any[]).map(dbTaskToApp);
  return dbProjectToApp(p, chars, taskList);
}

async function supabaseCreate(data: ProjectFormData): Promise<Project> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: p, error } = await db.from('projects').insert({
    title: data.title,
    client_name: data.clientName,
    description: data.description ?? null,
    status: data.status ?? 'active',
    manager_id: data.managerId || null,
    manager_name: data.managerName,
    due_date: data.dueDate ?? null,
    cover_color: data.coverColor ?? null,
  }).select().single();
  if (error) throw new Error(`Project create failed: ${error.message}`);
  return dbProjectToApp(p);
}

async function supabaseUpdate(id: string, data: Partial<ProjectFormData>): Promise<Project | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) payload.title = data.title;
  if (data.clientName !== undefined) payload.client_name = data.clientName;
  if (data.description !== undefined) payload.description = data.description;
  if (data.status !== undefined) payload.status = data.status;
  if (data.managerId !== undefined) payload.manager_id = data.managerId;
  if (data.managerName !== undefined) payload.manager_name = data.managerName;
  if (data.dueDate !== undefined) payload.due_date = data.dueDate;
  if (data.coverColor !== undefined) payload.cover_color = data.coverColor;

  const { error } = await db.from('projects').update(payload).eq('id', id);
  if (error) { log.warn('update failed', { id, error: error.message }); return null; }
  return supabaseFindById(id);
}

async function supabaseDelete(id: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { error } = await db.from('projects').delete().eq('id', id);
  if (error) { log.warn('delete failed', { id, error: error.message }); return false; }
  return true;
}

// ─── Mock: deep copy ─────────────────────────────────────────
function deepCopyProject(p: Project): Project {
  return {
    ...p,
    characters: p.characters.map((c) => ({ ...c })),
    tasks: p.tasks.map((t) => ({
      ...t,
      lines: (t.lines ?? []).map((l) => ({ ...l })),
      sourceFiles: [...(t.sourceFiles ?? [])],
      recordedFiles: [...(t.recordedFiles ?? [])],
    })),
  };
}

// ─── Public API ───────────────────────────────────────────────
export const projectRepository = {
  async findAll(): Promise<Project[]> {
    if (isSupabaseEnabled()) return supabaseFindAll();
    await mockDelay(MOCK_DELAY.normal);
    log.debug('findAll mock', { count: _store.length });
    return _store.map(deepCopyProject);
  },

  async findById(id: string): Promise<Project | null> {
    if (isSupabaseEnabled()) return supabaseFindById(id);
    await mockDelay(MOCK_DELAY.short);
    const project = _store.find((p) => p.id === id);
    return project ? deepCopyProject(project) : null;
  },

  async create(data: ProjectFormData): Promise<Project> {
    if (isSupabaseEnabled()) return supabaseCreate(data);
    await mockDelay(MOCK_DELAY.long);
    const ts = now();
    const project: Project = { ...data, id: genId('proj'), characters: [], tasks: [], createdAt: ts, updatedAt: ts };
    _store = [project, ..._store];
    log.info('mock create', { id: project.id });
    return deepCopyProject(project);
  },

  async update(id: string, data: Partial<ProjectFormData>): Promise<Project | null> {
    if (isSupabaseEnabled()) return supabaseUpdate(id, data);
    await mockDelay(MOCK_DELAY.normal);
    const idx = _store.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    _store[idx] = { ..._store[idx], ...data, updatedAt: now() };
    return deepCopyProject(_store[idx]);
  },

  async delete(id: string): Promise<boolean> {
    if (isSupabaseEnabled()) return supabaseDelete(id);
    await mockDelay(MOCK_DELAY.normal);
    const before = _store.length;
    _store = _store.filter((p) => p.id !== id);
    return _store.length < before;
  },

  _updateStore(id: string, updater: (p: Project) => Project): Project | null {
    const idx = _store.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    _store[idx] = updater(_store[idx]);
    return deepCopyProject(_store[idx]);
  },

  _getOrThrow(id: string): { project: Project; idx: number } {
    const idx = _store.findIndex((p) => p.id === id);
    if (idx === -1) throw new NotFoundError('Proje', id);
    return { project: _store[idx], idx };
  },
};
