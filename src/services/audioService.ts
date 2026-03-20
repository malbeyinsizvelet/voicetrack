// ============================================================
// AUDIO SERVICE
// Ses dosyası yükleme/indirme işlemleri.
// Gerçek sistemde AWS S3 / GCS / Azure Blob Storage
// entegrasyonu bu dosyaya yapılır.
// ============================================================

import type { AudioFile, AudioFileType } from '../types';

export const audioService = {
  /**
   * Ses dosyası yükle.
   * Gerçek sistemde: presigned URL al → dosyayı S3'e yükle → metadata kaydet.
   */
  async uploadFile(
    taskId: string,
    file: File,
    type: AudioFileType,
    uploadedBy: string
  ): Promise<AudioFile> {
    // Mock: dosyayı gerçekten yüklemez, sadece metadata döndürür
    await new Promise((r) => setTimeout(r, 1000));
    const mockFile: AudioFile = {
      id: `af_${Date.now()}`,
      taskId,
      type,
      fileName: file.name,
      fileSize: file.size,
      url: URL.createObjectURL(file), // Gerçekte: cloud URL
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    };
    return mockFile;
  },

  /**
   * Dosya indir.
   * Gerçek sistemde: presigned download URL al.
   */
  async getDownloadUrl(fileId: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 200));
    // Mock: gerçek URL döndürür gibi yapar
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
