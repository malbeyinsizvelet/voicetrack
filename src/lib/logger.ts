// ============================================================
// LOGGER
// Tüm log çağrıları bu modülden geçer.
// Gerçek sistemde: Sentry, DataDog, LogRocket vb. ile değiştirilir.
// Sadece bu dosyayı güncellemek yeterli olur.
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

// Geliştirme ortamında console, production'da external service
const isDev = (import.meta as unknown as { env: { DEV: boolean } }).env?.DEV ?? true;

function createEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown
): LogEntry {
  return {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };
}

function output(entry: LogEntry): void {
  if (!isDev) {
    // TODO: Sentry.captureMessage(entry.message, entry.level)
    // TODO: analytics.track(entry)
    return;
  }

  const prefix = `[VT][${entry.context ?? 'App'}]`;
  switch (entry.level) {
    case 'debug':
      console.debug(prefix, entry.message, entry.data ?? '');
      break;
    case 'info':
      console.info(prefix, entry.message, entry.data ?? '');
      break;
    case 'warn':
      console.warn(prefix, entry.message, entry.data ?? '');
      break;
    case 'error':
      console.error(prefix, entry.message, entry.data ?? '');
      break;
  }
}

// ─── Logger factory — her modül kendi prefix'ini alır ─────────

export function createLogger(context: string) {
  return {
    debug: (message: string, data?: unknown) =>
      output(createEntry('debug', message, context, data)),
    info: (message: string, data?: unknown) =>
      output(createEntry('info', message, context, data)),
    warn: (message: string, data?: unknown) =>
      output(createEntry('warn', message, context, data)),
    error: (message: string, data?: unknown) =>
      output(createEntry('error', message, context, data)),
  };
}

/** Uygulama geneli default logger */
export const logger = createLogger('App');
