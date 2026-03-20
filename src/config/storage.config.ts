export interface StorageConfig {
  token: string;
  repoId: string;
  repoType: 'dataset';
  branch: string;
  cdnBase: string;
  enabled: boolean;
}

function readEnv(key: string): string {
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env: Record<string, string> }).env) {
    return (import.meta as unknown as { env: Record<string, string> }).env[key] ?? '';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? '';
  }
  return '';
}

const HF_TOKEN  = readEnv('VITE_HF_TOKEN');
const HF_REPO   = readEnv('VITE_HF_REPO');
const HF_BRANCH = readEnv('VITE_HF_BRANCH') || 'main';

export const storageConfig: StorageConfig = {
  token:    HF_TOKEN,
  repoId:   HF_REPO,
  repoType: 'dataset',
  branch:   HF_BRANCH,
  cdnBase: `https://huggingface.co/datasets/${HF_REPO}/resolve/${HF_BRANCH}`,
  enabled: Boolean(HF_TOKEN && HF_REPO),
};

export function isStorageEnabled(): boolean { return storageConfig.enabled; }

export function buildCdnUrl(path: string): string {
  return `${storageConfig.cdnBase}/${path}`;
}

export function buildAuthorizedUrl(path: string): string {
  return `https://huggingface.co/datasets/${storageConfig.repoId}/resolve/${storageConfig.branch}/${path}`;
}
