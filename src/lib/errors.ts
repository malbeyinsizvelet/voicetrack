export class AppError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} bulunamadı: ${id}` : `${resource} bulunamadı`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Oturum açmanız gerekiyor') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Bu işlem için yetkiniz yok') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} servisi şu an kullanılamıyor`, 'SERVICE_UNAVAILABLE', 503);
    this.name = 'ServiceUnavailableError';
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Bilinmeyen bir hata oluştu';
}

export function isAppError(err: unknown): err is AppError { return err instanceof AppError; }
export function isNotFound(err: unknown): err is NotFoundError { return err instanceof NotFoundError; }
export function isUnauthorized(err: unknown): err is UnauthorizedError { return err instanceof UnauthorizedError; }
