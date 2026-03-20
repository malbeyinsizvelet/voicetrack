// ============================================================
// HF PATH SERVICE — Merkezi HF path üretici
//
// Tüm HF dosya yolları bu servisten üretilir.
// Hiçbir component veya servis doğrudan path string'i oluşturmaz.
//
// Klasör yapısı:
//   Project {CODE}/
//   ├── Originals/
//   │   └── {characterId}/{taskId}/{fileName}
//   ├── Recorded/
//   │   └── {characterId}/{taskId}/v{n}/{fileName}
//   └── Mixed/
//       └── {characterId}/{taskId}/{fileName}
//
// Örnek:
//   Project RE7/Originals/char1/task1/nova_ep01_ln001.wav
//   Project RE7/Recorded/char1/task1/v2/kayit.wav
// ============================================================

import {
  buildProjectFolderName,
  PROJECT_SUBFOLDERS,
} from '../utils/projectCodeGenerator';
import { sanitizeFileName } from './hfStorageService';

// ─── Tipler ──────────────────────────────────────────────────

export interface SourcePathParams {
  projectTitle: string;
  characterId: string;
  taskId: string;
  fileName: string;
}

export interface RecordedPathParams {
  projectTitle: string;
  characterId: string;
  taskId: string;
  versionNumber: number;
  fileName: string;
}

export interface MixedPathParams {
  projectTitle: string;
  characterId: string;
  taskId: string;
  fileName: string;
}

export interface PathContext {
  projectTitle: string;
  projectId: string;
  characterId: string;
  taskId: string;
}

// ─── Path Builder'lar ─────────────────────────────────────────

/**
 * Kaynak ses (Originals) için HF path üretir.
 * Project RE7/Originals/char1/task1/nova_ep01_ln001.wav
 */
export function buildSourcePath(params: SourcePathParams): string {
  const { projectTitle, characterId, taskId, fileName } = params;
  const projectFolder = buildProjectFolderName(projectTitle);
  const safeName = sanitizeFileName(fileName);
  return `${projectFolder}/${PROJECT_SUBFOLDERS.originals}/${characterId}/${taskId}/${safeName}`;
}

/**
 * Kayıt alınan ses (Recorded) için versiyonlu HF path üretir.
 * Project RE7/Recorded/char1/task1/v2/kayit.wav
 */
export function buildRecordedPath(params: RecordedPathParams): string {
  const { projectTitle, characterId, taskId, versionNumber, fileName } = params;
  const projectFolder = buildProjectFolderName(projectTitle);
  const safeName = sanitizeFileName(fileName);
  return `${projectFolder}/${PROJECT_SUBFOLDERS.recorded}/${characterId}/${taskId}/v${versionNumber}/${safeName}`;
}

/**
 * Mix/Master (Mixed) için HF path üretir. İleride kullanılacak.
 * Project RE7/Mixed/char1/task1/mixed_final.wav
 */
export function buildMixedPath(params: MixedPathParams): string {
  const { projectTitle, characterId, taskId, fileName } = params;
  const projectFolder = buildProjectFolderName(projectTitle);
  const safeName = sanitizeFileName(fileName);
  return `${projectFolder}/${PROJECT_SUBFOLDERS.mixed}/${characterId}/${taskId}/${safeName}`;
}

/**
 * HF repo'daki proje kök klasörünü döndürür.
 * "Project RE7"
 */
export function getProjectRootFolder(projectTitle: string): string {
  return buildProjectFolderName(projectTitle);
}

// ─── Namespace export ─────────────────────────────────────────

export const hfPathService = {
  buildSourcePath,
  buildRecordedPath,
  buildMixedPath,
  getProjectRootFolder,
};
