import { getErrorResponse } from './responses'

export class HTTPError extends Error {
  statusCode: number = 500

  constructor(message: string, statusCode: number) {
    super(message)
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

export function handleError(error: any): Response {
  // Possibly log the error somewhere

  if (error instanceof HTTPError) {
    return getErrorResponse(error.message, error.statusCode)
  }
  console.error('Unknown error occurred', error)
  return getErrorResponse('Unknown error occurred', 500)
}
