// ============================================================
// HUGGING FACE STORAGE SERVICE
// Tüm HF upload / download / path mantığı bu dosyada.
//
// Bağımlılık: @huggingface/hub (npm paketi)
//
// Dışarıya açık arayüz:
//   uploadToHF(params)      → HF dataset repo'ya yükle, URL döndür
//   getHFDownloadUrl(path)  → İndirme URL'i üret
//   downloadFromHF(...)     → Yetkili indirme (private repo)
//   buildHFPath(params)     → Merkezi dosya path'i oluştur
//   hfStorage               → Namespace export
//
// Storage provider değişirse (S3, GCS, Azure) →
//   Yalnızca bu dosya değişir. Tüketiciler etkilenmez.
// ============================================================

import { uploadFiles } from '@huggingface/hub';
import {
  storageConfig,
  isStorageEnabled,
  buildAuthorizedUrl,
} from '../config/storage.config';

// ─── Tipler ──────────────────────────────────────────────────

export interface HFUploadParams {
  /** Gerçek File nesnesi (browser native) */
  file: File;
  /** HF repo içindeki dosya yolu — buildHFPath() ile üretilmeli */
  path: string;
  /** Commit mesajı */
  commitMessage?: string;
  /** Progress callback — 0-100 arası */
  onProgress?: (pct: number) => void;
}

export interface HFUploadResult {
  /** HF repo içindeki dosya path'i */
  path: string;
  /** Dosyaya erişim URL'i */
  url: string;
  /** Yükleme zamanı */
  uploadedAt: string;
}

export interface HFPathParams {
  projectId: string;
  characterId: string;
  taskId: string;
  type: 'source' | 'recorded';
  /** Kayıt için versiyon numarası (source için 1) */
  version?: number;
  fileName: string;
}

// ─── Path Builder ─────────────────────────────────────────────

/**
 * Merkezi path oluşturucu.
 * Format:
 *   source:   {projectId}/{characterId}/{taskId}/source/{fileName}
 *   recorded: {projectId}/{characterId}/{taskId}/recorded/v{n}/{fileName}
 *
 * Bu format dosyaların HF repo'da düzenli durmasını sağlar.
 * Hiçbir dosya birbirinin üzerine yazmaz (versiyon sayesinde).
 */
export function buildHFPath(params: HFPathParams): string {
  const { projectId, characterId, taskId, type, version = 1, fileName } = params;

  // Güvenli dosya adı — özel karakterleri temizle
  const safeName = sanitizeFileName(fileName);

  if (type === 'source') {
    return `${projectId}/${characterId}/${taskId}/source/${safeName}`;
  }

  return `${projectId}/${characterId}/${taskId}/recorded/v${version}/${safeName}`;
}

/** Dosya adını path-safe hale getirir */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFC')
    .replace(/[/\\?%*:|"<>]/g, '_')  // path tehlikeli karakterler
    .replace(/\s+/g, '_')             // boşluklar
    .replace(/_+/g, '_')              // ardışık alt çizgiler
    .trim();
}

// ─── Upload ───────────────────────────────────────────────────

/**
 * Tek dosyayı Hugging Face dataset repo'ya yükler.
 *
 * @huggingface/hub — uploadFiles kullanır.
 * Browser native File desteği: dosya direkt blob olarak stream edilir.
 *
 * Progress: upload öncesi %0-10, upload süresince tahmin, tamamda %100.
 *
 * CORS: HF API cross-origin request'e izin veriyor.
 * Token: Authorization header ile gönderilir.
 *
 * Hata durumunda: Error fırlatır → tüketici try/catch ile yakalar.
 */
export async function uploadToHF(params: HFUploadParams): Promise<HFUploadResult> {
  const { file, path, commitMessage, onProgress } = params;

  if (!isStorageEnabled()) {
    throw new Error(
      [
        'Hugging Face storage yapılandırılmamış.',
        'Lütfen proje kökünde .env dosyası oluştur:',
        '  VITE_HF_TOKEN=hf_xxxxxxxxxxxx',
        '  VITE_HF_REPO=kullanici/voicetrack-storage',
      ].join('\n')
    );
  }

  const commit = commitMessage ?? `VoiceTrack: upload ${path}`;

  onProgress?.(0);

  // Dosya boyutuna göre tahmini süre (HF upload hızı: ~2-5 MB/s ortalama)
  const estimatedMs = Math.min(
    Math.max((file.size / (1024 * 1024)) * 500, 800),
    15_000
  );

  // Upload süresi boyunca simüle progress (0→85)
  // Gerçek upload paralel çalışır — progress HF SDK'dan gelmez
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let currentProgress = 0;

  const startProgressSim = () => {
    const steps = 30;
    const stepMs = estimatedMs / steps;

    progressInterval = setInterval(() => {
      if (currentProgress < 85) {
        currentProgress = Math.min(currentProgress + (85 / steps), 85);
        onProgress?.(Math.round(currentProgress));
      }
    }, stepMs);
  };

  const stopProgressSim = () => {
    if (progressInterval !== null) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  };

  try {
    startProgressSim();

    // Gerçek HF upload — @huggingface/hub native browser File desteği
    await uploadFiles({
      repo: {
        type: storageConfig.repoType,
        name: storageConfig.repoId,
      },
      accessToken: storageConfig.token,
      branch: storageConfig.branch,
      commitTitle: commit,
      files: [
        {
          path,
          content: file, // Native File — Blob olarak işlenir
        },
      ],
    });

    stopProgressSim();
    onProgress?.(100);

    return {
      path,
      url: buildAuthorizedUrl(path),
      uploadedAt: new Date().toISOString(),
    };
  } catch (err) {
    stopProgressSim();
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Hugging Face upload başarısız: ${message}`);
  }
}

// ─── Download URL ─────────────────────────────────────────────

/**
 * HF repo'daki dosya için erişim URL'i döndürür.
 *
 * Public repo  → CDN URL direkt çalışır, header gerekmez.
 * Private repo → Authorization header gerekir.
 *   → downloadFromHF() fetch+blob yöntemi ile çalışır.
 *
 * Gerçek prodüksiyonda: kendi backend'in HF'ten presigned URL alır,
 * frontend'e döner ve frontend direkt <a download> ile indirir.
 */
export function getHFDownloadUrl(path: string): string {
  return buildAuthorizedUrl(path);
}

/**
 * Private HF repo'dan yetkili download.
 *
 * Akış:
 *   1. fetch() + Authorization header → HF stream
 *   2. ReadableStream → chunks toplama + progress takibi
 *   3. Blob → Object URL → <a download> → browser download
 *   4. Object URL temizle
 *
 * CORS notu: HF API cross-origin blob fetch'e izin veriyor
 * ancak bazı network ortamlarında kısıtlı olabilir.
 * Sorun yaşarsan: backend proxy ekle ve token yalnızca server'da tut.
 */
export async function downloadFromHF(
  path: string,
  fileName: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  if (!isStorageEnabled()) {
    throw new Error('Storage yapılandırılmamış. .env dosyasını kontrol et.');
  }

  const url = buildAuthorizedUrl(path);

  onProgress?.(0);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${storageConfig.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `İndirme başarısız: HTTP ${response.status} ${response.statusText}`
    );
  }

  if (!response.body) {
    throw new Error('Response body boş — indirme başlatılamadı.');
  }

  // İçerik boyutunu al (varsa)
  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  // Stream → chunks
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;

    if (total > 0) {
      onProgress?.(Math.round((received / total) * 90));
    } else {
      // Content-Length bilinmiyor — belirsiz progress
      onProgress?.(Math.min(received / 10_000, 80));
    }
  }

  // Blob oluştur — Uint8Array direkt BlobPart kabul edilir
  const blob = new Blob(chunks as BlobPart[], {
    type: response.headers.get('Content-Type') ?? 'application/octet-stream',
  });

  // Browser download tetikle
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 300);

  onProgress?.(100);
}

// ─── Namespace export ─────────────────────────────────────────

export const hfStorage = {
  upload: uploadToHF,
  getDownloadUrl: getHFDownloadUrl,
  download: downloadFromHF,
  buildPath: buildHFPath,
  isEnabled: isStorageEnabled,
};
