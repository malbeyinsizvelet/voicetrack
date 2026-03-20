// ============================================================
// MOCK BARREL
// Tüm mock veriler ve factory'ler buradan export edilir.
// Gerçek backend entegrasyonunda bu dosya tamamen kaldırılır.
// ============================================================

export { MOCK_USERS, MOCK_CREDENTIALS } from './users';
export type { MockCredential } from './users';
export { MOCK_PROJECTS } from './projects';

// Factory — test ve dev ortamında dinamik mock üretimi
export {
  createMockUser,
  createMockProject,
  createMockCharacter,
  createMockTask,
  createMockLine,
  createMockLines,
  createMockAudioFile,
} from './factory';
