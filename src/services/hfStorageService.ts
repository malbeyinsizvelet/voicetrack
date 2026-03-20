import { uploadFiles } from '@huggingface/hub';
import { storageConfig, isStorageEnabled, buildAuthorizedUrl } from '../config/storage.config';

export interface HFUploadParams {
  file: File;
  path: string;
  commitMessage?: string;
  onProgress?: (pct: number) => void;
}

export interface HFUploadResult {
  path: string;
  url: string;
  uploadedAt: string;
}

export interface HFPathParams {
  projectId: string;
  characterId: string;
  taskId: string;
  type: 'source' | 'recorded';
  version?: number;
  fileName: string;
}

export function buildHFPath(params: HFPathParams): string {
  const { projectId, characterId, taskId, type, version = 1, fileName } = params;
  const safeName = sanitizeFileName(fileName);
  if (type === 'source') return `${projectId}/${characterId}/${taskId}/source/${safeName}`;
  return `${projectId}/${characterId}/${taskId}/recorded/v${version}/${safeName}`;
}

export function sanitizeFileName(fileName: string): string {
  return fileName.normalize('NFC').replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').trim();
}

export async function uploadToHF(params: HFUploadParams): Promise<HFUploadResult> {
  const { file, path, commitMessage, onProgress } = params;
  if (!isStorageEnabled()) throw new Error('Hugging Face storage yapılandırılmamış.');
  const commit = commitMessage ?? `VoiceTrack: upload ${path}`;
  onProgress?.(0);
  const estimatedMs = Math.min(Math.max((file.size / (1024 * 1024)) * 500, 800), 15_000);
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let currentProgress = 0;
  const startProgressSim = () => {
    const steps = 30;
    const stepMs = estimatedMs / steps;
    progressInterval = setInterval(() => { if (currentProgress < 85) { currentProgress += (85 / steps); onProgress?.(Math.round(currentProgress)); } }, stepMs);
  };
  const stopProgressSim = () => { if (progressInterval !== null) { clearInterval(progressInterval); progressInterval = null; } };
  try {
    startProgressSim();
    await uploadFiles({ repo: { type: storageConfig.repoType, name: storageConfig.repoId }, accessToken: storageConfig.token, branch: storageConfig.branch, commitTitle: commit, files: [{ path, content: file }] });
    stopProgressSim();
    onProgress?.(100);
    return { path, url: buildAuthorizedUrl(path), uploadedAt: new Date().toISOString() };
  } catch (err) {
    stopProgressSim();
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Hugging Face upload başarısız: ${message}`);
  }
}

export function getHFDownloadUrl(path: string): string { return buildAuthorizedUrl(path); }

export async function downloadFromHF(path: string, fileName: string, onProgress?: (pct: number) => void): Promise<void> {
  if (!isStorageEnabled()) throw new Error('Storage yapılandırılmamış.');
  const url = buildAuthorizedUrl(path);
  onProgress?.(0);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${storageConfig.token}` } });
  if (!response.ok) throw new Error(`İndirme başarısız: HTTP ${response.status} ${response.statusText}`);
  if (!response.body) throw new Error('Response body boş.');
  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total > 0) onProgress?.(Math.round((received / total) * 90));
    else onProgress?.(Math.min(received / 10_000, 80));
  }
  const blob = new Blob(chunks as BlobPart[], { type: response.headers.get('Content-Type') ?? 'application/octet-stream' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = blobUrl; a.download = fileName; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 300);
  onProgress?.(100);
}

export const hfStorage = { upload: uploadToHF, getDownloadUrl: getHFDownloadUrl, download: downloadFromHF, buildPath: buildHFPath, isEnabled: isStorageEnabled };
