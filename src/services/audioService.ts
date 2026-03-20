import type { AudioFile, AudioFileType } from '../types';

export const audioService = {
  async uploadFile(taskId: string, file: File, type: AudioFileType, uploadedBy: string): Promise<AudioFile> {
    await new Promise((r) => setTimeout(r, 1000));
    return { id: `af_${Date.now()}`, taskId, type, fileName: file.name, fileSize: file.size, url: URL.createObjectURL(file), uploadedBy, uploadedAt: new Date().toISOString() };
  },

  async getDownloadUrl(fileId: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 200));
    return `/mock/audio/${fileId}.wav`;
  },

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  formatDuration(seconds?: number): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
};
