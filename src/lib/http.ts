import { createLogger } from './logger';
import { AppError, UnauthorizedError } from './errors';
import { storage, SESSION_KEY } from './storage';
import type { AuthSession } from '../types';

const log = createLogger('HTTP');

interface HttpConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
  timeout: number;
  mockDelayMs: number;
}

const config: HttpConfig = {
  baseUrl: '/api',
  defaultHeaders: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  timeout: 30_000,
  mockDelayMs: 300,
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  delay?: number;
}

export interface ApiResponse<T> {
  data: T;
  ok: boolean;
  status: number;
  message?: string;
}

function getAuthToken(): string | null {
  const session = storage.get<AuthSession>(SESSION_KEY);
  return session?.token ?? null;
}

const MOCK_MODE = true;

export async function mockDelay(ms?: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms ?? config.mockDelayMs));
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, delay } = options;

  if (MOCK_MODE) {
    await mockDelay(delay);
    log.debug(`[MOCK] ${method} ${endpoint}`, body);
    return { data: null as unknown as T, ok: true, status: 200 };
  }

  const token = getAuthToken();
  const url = `${config.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      ...config.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(config.timeout),
  });

  let data: T;
  try { data = await response.json(); }
  catch { data = null as unknown as T; }

  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) {
    const message = (data as { message?: string })?.message ?? response.statusText;
    throw new AppError(message, `HTTP_${response.status}`, response.status);
  }

  log.debug(`${method} ${url} → ${response.status}`);
  return { data, ok: response.ok, status: response.status };
}

export const http = {
  get:    <T>(endpoint: string, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'GET' }),
  post:   <T>(endpoint: string, body?: unknown, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'POST', body }),
  put:    <T>(endpoint: string, body?: unknown, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'PUT', body }),
  patch:  <T>(endpoint: string, body?: unknown, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'PATCH', body }),
  delete: <T>(endpoint: string, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'DELETE' }),
};
