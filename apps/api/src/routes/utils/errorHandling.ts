import { IRequest, StatusError } from 'itty-router'

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class HTTPError extends StatusError {
  statusCode: number = 500

  constructor(message: string, statusCode: number) {
    super(statusCode, message)
    this.name = this.constructor.name
    this.statusCode = statusCode
  }
}

export class BusinessLogicError extends HTTPError {
  constructor(message: string, statusCode: number = 400) {
    super(message, statusCode)
  }
}

export class InternalServerError extends HTTPError {
  constructor(message: string) {
    super(message, 500)
  }
}

export class NotFoundError extends HTTPError {
  constructor(message: string = 'Not Found') {
    super(message, 404)
  }
}

export class ValidationError extends HTTPError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class UnauthorizedError extends HTTPError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends HTTPError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

// ============================================================================
// ERROR CONTEXT & STRUCTURED LOGGING
// ============================================================================

interface ErrorContext {
  correlationId?: string
  userId?: number
  endpoint?: string
  method?: string
  requestBody?: any
  requestParams?: any
  userAgent?: string
  ip?: string
  timestamp?: Date
  duration?: number
}

interface StructuredError {
  message: string
  statusCode: number
  correlationId: string
  timestamp: Date
  context: ErrorContext
  stack?: string
  errorType: string
}

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function logStructuredError(structuredError: StructuredError): void {
  const logEntry = {
    level: 'error',
    message: structuredError.message,
    statusCode: structuredError.statusCode,
    correlationId: structuredError.correlationId,
    timestamp: structuredError.timestamp.toISOString(),
    errorType: structuredError.errorType,
    context: {
      endpoint: structuredError.context.endpoint,
      method: structuredError.context.method,
      userId: structuredError.context.userId,
      userAgent: structuredError.context.userAgent,
      ip: structuredError.context.ip,
      duration: structuredError.context.duration
    },
    stack: structuredError.stack
  }

  console.error(JSON.stringify(logEntry, null, 2))
}

function getErrorResponse(error: string, status: number = 400): Response {
  return Response.json({ error }, { status })
}

export function extractRequestContext(request: Request): ErrorContext {
  const url = new URL(request.url)
  return {
    endpoint: url.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip:
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      undefined,
    timestamp: new Date()
  }
}

// ============================================================================
// CORE ERROR HANDLER
// ============================================================================

export function handleError(
  error: any,
  context: ErrorContext = {},
  customMessage?: string
): Response {
  const correlationId = context.correlationId || generateCorrelationId()
  const timestamp = new Date()

  let statusCode = 500
  let message = customMessage || 'Internal server error'
  let errorType = 'UnknownError'

  if (error instanceof HTTPError) {
    statusCode = error.statusCode
    message = error.message
    errorType = error.constructor.name
  } else if (error instanceof Error) {
    errorType = error.constructor.name
    if (!customMessage) {
      message = error.message || 'An error occurred'
    }
  }

  const structuredError: StructuredError = {
    message,
    statusCode,
    correlationId,
    timestamp,
    context: {
      ...context,
      timestamp
    },
    stack: error?.stack,
    errorType
  }

  logStructuredError(structuredError)

  const response = getErrorResponse(message, statusCode)
  response.headers.set('X-Correlation-ID', correlationId)
  return response
}

// ============================================================================
// ROUTE ERROR HANDLING WRAPPERS
// ============================================================================

/**
 * Helper function to create standardized error handling for route handlers
 * Usage in route handle method:
 *
 * async handle(request: IRequest, env: any, context: any) {
 *   return withErrorHandling(request, async () => {
 *     // Your route logic here
 *     const data = await this.getValidatedData<typeof this.schema>()
 *     // ... business logic
 *     return Response.json(result)
 *   })
 * }
 */
export async function withErrorHandling<T>(
  request: IRequest,
  routeHandler: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  const requestContext = extractRequestContext(request)

  try {
    return await routeHandler()
  } catch (error) {
    const enrichedContext = {
      ...requestContext,
      duration: Date.now() - startTime,
      requestParams: request.params,
      requestBody: (request as any).body || undefined
    }

    return handleError(error, enrichedContext) as T
  }
}

/**
 * Alternative approach: Create error handler function that can be called from catch blocks
 * Usage in route handle method:
 *
 * async handle(request: IRequest, env: any, context: any) {
 *   const errorHandler = createErrorHandler(request)
 *
 *   try {
 *     // Your route logic here
 *     return Response.json(result)
 *   } catch (error) {
 *     return errorHandler(error)
 *   }
 * }
 */
export function createErrorHandler(
  request: IRequest,
  startTime: number = Date.now()
) {
  const requestContext = extractRequestContext(request)

  return (error: any, customMessage?: string) => {
    const enrichedContext = {
      ...requestContext,
      duration: Date.now() - startTime,
      requestParams: request.params,
      requestBody: (request as any).body || undefined
    }

    return handleError(error, enrichedContext, customMessage)
  }
}
