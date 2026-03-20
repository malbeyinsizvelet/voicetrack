import { mockDelay } from '../lib/http';
import { NotFoundError } from '../lib/errors';
import { createLogger } from '../lib/logger';
import { MOCK_DELAY } from '../constants';

export { mockDelay, NotFoundError, createLogger, MOCK_DELAY };

export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function now(): string {
  return new Date().toISOString();
}

export interface Repository<T, CreateDTO, UpdateDTO> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
