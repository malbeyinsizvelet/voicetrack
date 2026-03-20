// ============================================================
// MOCK FACTORY
// Test ve geliştirme için tip-güvenli mock nesne üretimi.
// Gerçek sistemde test framework factory'leriyle değiştirilir.
// ============================================================

import type {
  User,
  Project,
  Character,
  Task,
  RecordingLine,
  AudioFile,
  UserRole,
  ProjectStatus,
  TaskStatus,
  LineStatus,
  CharacterGender,
  CharacterPriority,
} from '../types';

let _idCounter = 1;
const uid = (prefix: string) => `${prefix}_mock_${_idCounter++}`;
const ts = () => new Date().toISOString();

// ─── User ─────────────────────────────────────────────────────

export function createMockUser(overrides: Partial<User> = {}): User {
  const id = uid('user');
  return {
    id,
    name: `Mock User ${_idCounter}`,
    email: `mock${_idCounter}@voicetrack.io`,
    role: 'voice_artist' as UserRole,
    createdAt: ts(),
    ...overrides,
  };
}

// ─── AudioFile ────────────────────────────────────────────────

export function createMockAudioFile(overrides: Partial<AudioFile> = {}): AudioFile {
  const id = uid('af');
  return {
    id,
    taskId: uid('task'),
    type: 'source',
    fileName: `mock_audio_${_idCounter}.wav`,
    fileSize: 1024 * 1024 * Math.ceil(Math.random() * 10),
    duration: Math.floor(Math.random() * 30) + 1,
    url: `https://mock.storage/audio/${id}.wav`,
    uploadedBy: uid('user'),
    uploadedAt: ts(),
    ...overrides,
  };
}

// ─── RecordingLine ────────────────────────────────────────────

export function createMockLine(
  taskId: string,
  lineNumber: number,
  overrides: Partial<RecordingLine> = {}
): RecordingLine {
  return {
    id: uid('line'),
    taskId,
    lineNumber,
    status: 'pending' as LineStatus,
    retakeCount: 0,
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

// ─── Task ─────────────────────────────────────────────────────

export function createMockTask(overrides: Partial<Task> = {}): Task {
  const id = uid('task');
  return {
    id,
    projectId: uid('proj'),
    characterId: uid('ch'),
    characterName: `Karakter ${_idCounter}`,
    assignedTo: '',
    assignedArtistName: 'Atanmamış',
    lineCount: 0,
    status: 'pending' as TaskStatus,
    sourceFiles: [],
    recordedFiles: [],
    lines: [],
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

// ─── Character ────────────────────────────────────────────────

export function createMockCharacter(
  projectId: string,
  overrides: Partial<Character> = {}
): Character {
  return {
    id: uid('ch'),
    projectId,
    name: `Karakter ${_idCounter}`,
    gender: 'neutral' as CharacterGender,
    priority: 'normal' as CharacterPriority,
    lineCount: 0,
    completedCount: 0,
    order: _idCounter,
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

// ─── Project ──────────────────────────────────────────────────

export function createMockProject(overrides: Partial<Project> = {}): Project {
  const id = uid('proj');
  return {
    id,
    title: `Mock Proje ${_idCounter}`,
    clientName: 'Mock Müşteri',
    description: 'Mock proje açıklaması',
    status: 'active' as ProjectStatus,
    managerId: uid('user'),
    managerName: 'Mock Yönetici',
    characters: [],
    tasks: [],
    coverColor: '#6366f1',
    createdAt: ts(),
    updatedAt: ts(),
    ...overrides,
  };
}

// ─── Bulk helpers ─────────────────────────────────────────────

/** N adet mock line oluştur */
export function createMockLines(taskId: string, count: number, statusDist?: {
  pending?: number;
  recorded?: number;
  approved?: number;
  rejected?: number;
}): RecordingLine[] {
  const lines: RecordingLine[] = [];
  const { pending = count, recorded = 0, approved = 0, rejected = 0 } = statusDist ?? {};

  const statuses: LineStatus[] = [
    ...Array(approved).fill('approved'),
    ...Array(recorded).fill('recorded'),
    ...Array(rejected).fill('rejected'),
    ...Array(Math.max(0, count - approved - recorded - rejected)).fill('pending'),
  ];

  for (let i = 0; i < count; i++) {
    lines.push(createMockLine(taskId, i + 1, {
      status: statuses[i] ?? 'pending',
      sourceFile: createMockAudioFile({ taskId, type: 'source' }),
    }));
  }

  void pending; // used via default
  return lines;
}
