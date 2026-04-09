import type { ContentfulStatusCode } from 'hono/utils/http-status'

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

/**
 * Base application error class.
 * All known errors should extend this class.
 * Unknown errors will result in a 500 response.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: ContentfulStatusCode = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

// ============================================================================
// SPECIFIC ERROR CLASSES
// ============================================================================

export class BadRequestError extends AppError {
  constructor(
    message: string = 'Bad Request',
    details?: Record<string, unknown>
  ) {
    super(message, 400, details)
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 400, errors ? { errors } : undefined)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404)
  }
}

export class AlreadyExistsError extends AppError {
  constructor(
    message: string = 'Resource already exists',
    details?: Record<string, unknown>
  ) {
    super(message, 409, details)
  }
}

export class TooManyRequestsError extends AppError {
  constructor(
    message: string = 'Too Many Requests',
    details?: Record<string, unknown>
  ) {
    super(message, 429, details)
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500)
  }
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

export interface ErrorContext {
  endpoint?: string
  method?: string
  userAgent?: string
  ip?: string
}

/**
 * Central error handler. Converts errors to HTTP responses.
 * - AppError instances: uses their statusCode and message
 * - Unknown errors: logs and returns 500
 */
export function handleError(error: unknown, context?: ErrorContext): Response {
  // Known application error
  if (error instanceof AppError) {
    const body: Record<string, unknown> = { error: error.message }
    if (error.details) {
      Object.assign(body, error.details)
    }
    return Response.json(body, { status: error.statusCode })
  }

  // Unknown error - log with context and return 500
  console.error('Unexpected error:', { error, context })
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
