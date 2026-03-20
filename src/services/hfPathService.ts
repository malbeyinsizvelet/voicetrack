import { buildProjectFolderName, PROJECT_SUBFOLDERS } from '../utils/projectCodeGenerator';
import { sanitizeFileName } from './hfStorageService';

export interface SourcePathParams { projectTitle: string; characterId: string; taskId: string; fileName: string; }
export interface RecordedPathParams { projectTitle: string; characterId: string; taskId: string; versionNumber: number; fileName: string; }
export interface MixedPathParams { projectTitle: string; characterId: string; taskId: string; fileName: string; }
export interface PathContext { projectTitle: string; projectId: string; characterId: string; taskId: string; }

export function buildSourcePath(params: SourcePathParams): string {
  const { projectTitle, characterId, taskId, fileName } = params;
  const projectFolder = buildProjectFolderName(projectTitle);
  const safeName = sanitizeFileName(fileName);
  return `${projectFolder}/${PROJECT_SUBFOLDERS.originals}/${characterId}/${taskId}/${safeName}`;
}

export function buildRecordedPath(params: RecordedPathParams): string {
  const { projectTitle, characterId, taskId, versionNumber, fileName } = params;
  const projectFolder = buildProjectFolderName(projectTitle);
  const safeName = sanitizeFileName(fileName);
  return `${projectFolder}/${PROJECT_SUBFOLDERS.recorded}/${characterId}/${taskId}/v${versionNumber}/${safeName}`;
}

export function buildMixedPath(params: MixedPathParams): string {
  const { projectTitle, characterId, taskId, fileName } = params;
  const projectFolder = buildProjectFolderName(projectTitle);
  const safeName = sanitizeFileName(fileName);
  return `${projectFolder}/${PROJECT_SUBFOLDERS.mixed}/${characterId}/${taskId}/${safeName}`;
}

export function getProjectRootFolder(projectTitle: string): string { return buildProjectFolderName(projectTitle); }

export const hfPathService = { buildSourcePath, buildRecordedPath, buildMixedPath, getProjectRootFolder };
