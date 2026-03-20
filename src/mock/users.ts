import type { User } from '../types';

export interface MockCredential {
  userId: string;
  email: string;
  password: string;
}

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ahmet Yılmaz', email: 'ahmet@voicetrack.io', role: 'admin',           avatarUrl: undefined, createdAt: '2024-01-10T09:00:00Z' },
  { id: 'u2', name: 'Selin Kaya',   email: 'selin@voicetrack.io', role: 'project_manager', avatarUrl: undefined, createdAt: '2024-01-12T10:00:00Z' },
  { id: 'u3', name: 'Mert Demir',   email: 'mert@voicetrack.io',  role: 'voice_artist',    avatarUrl: undefined, createdAt: '2024-02-01T08:00:00Z' },
  { id: 'u4', name: 'Ayşe Çelik',   email: 'ayse@voicetrack.io',  role: 'voice_artist',    avatarUrl: undefined, createdAt: '2024-02-05T08:00:00Z' },
  { id: 'u5', name: 'Can Öztürk',   email: 'can@voicetrack.io',   role: 'qc_reviewer',     avatarUrl: undefined, createdAt: '2024-02-10T08:00:00Z' },
];

export const MOCK_CREDENTIALS: MockCredential[] = [
  { userId: 'u1', email: 'ahmet@voicetrack.io', password: 'admin123'  },
  { userId: 'u2', email: 'selin@voicetrack.io', password: 'pm123'     },
  { userId: 'u3', email: 'mert@voicetrack.io',  password: 'artist123' },
  { userId: 'u4', email: 'ayse@voicetrack.io',  password: 'artist123' },
  { userId: 'u5', email: 'can@voicetrack.io',   password: 'qc123'     },
];
