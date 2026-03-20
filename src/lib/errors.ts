// ============================================================
// DOMAIN ERROR CLASSES
// Tüm uygulama katmanları bu hata sınıflarını fırlatır.
// Gerçek sistemde HTTP status code'larıyla eşleştirilir.
// ============================================================

/** Temel uygulama hatası — tüm domain hataları buradan türer */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Kaynak bulunamadı (404) */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} bulunamadı: ${id}` : `${resource} bulunamadı`,
      'NOT_FOUND',
      404
    );
    this.name = 'NotFoundError';
  }
}

/** Yetkisiz erişim (401) */
export class UnauthorizedError extends AppError {
  constructor(message = 'Oturum açmanız gerekiyor') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

/** Yasak erişim (403) */
export class ForbiddenError extends AppError {
  constructor(message = 'Bu işlem için yetkiniz yok') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/** Validasyon hatası (400) */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/** Çakışma hatası — örneğin duplicate dosya (409) */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

/** Servis geçici olarak kullanılamıyor (503) */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} servisi şu an kullanılamıyor`, 'SERVICE_UNAVAILABLE', 503);
    this.name = 'ServiceUnavailableError';
  }
}

// ─── Hata yardımcıları ─────────────────────────────────────────

/** Bilinmeyen hata → okunabilir mesaj */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Bilinmeyen bir hata oluştu';
}

/** Hata tipini kontrol et */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function isNotFound(err: unknown): err is NotFoundError {
  return err instanceof NotFoundError;
}

export function isUnauthorized(err: unknown): err is UnauthorizedError {
  return err instanceof UnauthorizedError;
}
