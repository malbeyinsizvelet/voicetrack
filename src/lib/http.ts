// ============================================================
// HTTP CLIENT
// Gerçek backend entegrasyonunda fetch/axios buraya taşınır.
// Şu an mock delay simülasyonu yapıyor.
// Tüm servisler bu client'ı kullanır — tüketiciler değişmez.
// ============================================================

import { createLogger } from './logger';
import { AppError, UnauthorizedError } from './errors';
import { storage, SESSION_KEY } from './storage';
import type { AuthSession } from '../types';

const log = createLogger('HTTP');

// ─── Yapılandırma ────────────────────────────────────────────

interface HttpConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
  timeout: number;
  mockDelayMs: number;
}

const config: HttpConfig = {
  baseUrl: '/api',               // Gerçek API'de değişir (env var'dan okunur)
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30_000,
  mockDelayMs: 300,              // Mock modda yapay gecikme
};

// ─── Request / Response tipleri ─────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Mock modda kaç ms beklensin (varsayılan: config.mockDelayMs) */
  delay?: number;
}

export interface ApiResponse<T> {
  data: T;
  ok: boolean;
  status: number;
  message?: string;
}

// ─── Auth token helper ───────────────────────────────────────

function getAuthToken(): string | null {
  const session = storage.get<AuthSession>(SESSION_KEY);
  return session?.token ?? null;
}

// ─── Mock mode ───────────────────────────────────────────────
// Gerçek backend olmadığında bu flag true olur.
// import.meta.env.VITE_USE_MOCK_API="true" (varsayılan: true)

const MOCK_MODE = true; // TODO: import.meta.env.VITE_USE_MOCK_API !== 'false'

async function mockDelay(ms?: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms ?? config.mockDelayMs));
}

// ─── HTTP Client ─────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, delay } = options;

  if (MOCK_MODE) {
    // Mock modda: gerçek fetch yapmaz, sadece delay simüle eder
    await mockDelay(delay);
    // Bu noktada mock verisi döndürülmez — repository katmanı in-memory store'u doğrudan kullanır
    // Gerçek API'ye geçince bu blok kaldırılır ve aşağıdaki fetch aktif olur
    log.debug(`[MOCK] ${method} ${endpoint}`, body);
    return { data: null as unknown as T, ok: true, status: 200 };
  }

  // ─── Gerçek fetch (MOCK_MODE = false olunca aktif olur) ───
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
  try {
    data = await response.json();
  } catch {
    data = null as unknown as T;
  }

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    const message = (data as { message?: string })?.message ?? response.statusText;
    throw new AppError(message, `HTTP_${response.status}`, response.status);
  }

  log.debug(`${method} ${url} → ${response.status}`);
  return { data, ok: response.ok, status: response.status };
}

// ─── Typed convenience methods ───────────────────────────────

export const http = {
  get: <T>(endpoint: string, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'PATCH', body }),

  delete: <T>(endpoint: string, opts?: RequestOptions) =>
    request<T>(endpoint, { ...opts, method: 'DELETE' }),
};

export { mockDelay };
