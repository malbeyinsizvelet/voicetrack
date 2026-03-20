// ============================================================
// STORAGE CONFIGURATION
// Hugging Face Dataset Repository üzerinden dosya depolama.
//
// ── KULLANIM ──
//   1. Hugging Face'te bir dataset repo oluştur (private önerilir)
//   2. Aşağıdaki değerleri doldur:
//      HF_TOKEN  → repo'ya yazma yetkisi olan access token
//      HF_REPO   → "kullanici-adi/repo-adi" formatında dataset adı
//
// ── .env KULLANIMI (Vite) ──
//   Proje kökünde .env dosyası oluştur:
//     VITE_HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
//     VITE_HF_REPO=kullanici/voicetrack-storage
//
// ── HARDCODE (geçici test için) ──
//   HF_TOKEN ve HF_REPO alanlarını direkt buraya yazabilirsin.
//   Prodüksiyonda kesinlikle env kullan.
//
// ── GÜVENLİK NOTU ──
//   HF token browser'da görünür — bu bir limitation.
//   Gerçek prodüksiyonda upload/download için kendi backend'ini
//   kur ve token yalnızca server tarafında kalsın.
//   Bu yapı; "storage backend = HF" yaklaşımı için geçici çözümdür.
// ============================================================

export interface StorageConfig {
  /** Hugging Face API Token — hf_... formatında */
  token: string;
  /** Dataset repo ID — "owner/repo-name" formatında */
  repoId: string;
  /** Repo tipi — her zaman dataset */
  repoType: 'dataset';
  /** Branch / revision — main yeterli */
  branch: string;
  /** Public CDN base URL — dosyalara doğrudan erişim için */
  cdnBase: string;
  /** Storage aktif mi — false ise mock moda düşer */
  enabled: boolean;
}

// ── Env değerlerini oku ──────────────────────────────────────
// Vite'da env değişkenleri VITE_ prefix'i ile import.meta.env'den okunur.
// Node/CRA'da process.env kullanılır.

function readEnv(key: string): string {
  // Vite
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key] ?? '';
  }
  // Node fallback
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? '';
  }
  return '';
}

// ── Temel konfigürasyon ──────────────────────────────────────

const HF_TOKEN  = readEnv('VITE_HF_TOKEN');   // ← .env'den okunur
const HF_REPO   = readEnv('VITE_HF_REPO');    // ← .env'den okunur
const HF_BRANCH = readEnv('VITE_HF_BRANCH') || 'main';

export const storageConfig: StorageConfig = {
  token:    HF_TOKEN,
  repoId:   HF_REPO,
  repoType: 'dataset',
  branch:   HF_BRANCH,

  // Hugging Face public CDN — private repo için token gerekir (ayrı endpoint)
  cdnBase: `https://huggingface.co/datasets/${HF_REPO}/resolve/${HF_BRANCH}`,

  // Token ve repo her ikisi de doluysa aktif
  enabled: Boolean(HF_TOKEN && HF_REPO),
};

// ── Yardımcı ─────────────────────────────────────────────────

export function isStorageEnabled(): boolean {
  return storageConfig.enabled;
}

/** Dosya path'ini tam CDN URL'e çevirir */
export function buildCdnUrl(path: string): string {
  return `${storageConfig.cdnBase}/${path}`;
}

/**
 * HF private repo dosyasına yetkili erişim URL'i.
 * Private repo'da CDN yerine bu endpoint kullanılır.
 * Response: redirect to presigned S3 URL (1 dakika geçerli).
 */
export function buildAuthorizedUrl(path: string): string {
  return `https://huggingface.co/datasets/${storageConfig.repoId}/resolve/${storageConfig.branch}/${path}`;
}
