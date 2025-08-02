import { toast } from 'sonner'

interface ValidationError {
  field: string
  message: string
}

interface ApiError {
  error: string
  errors?: ValidationError[]
}

/**
 * Handles validation errors from API responses by showing toast notifications
 * for each individual error. If there are multiple errors, each gets its own toast.
 * If there's a general error message, it gets shown as well.
 */
export function handleValidationErrors(error: unknown) {
  if (!error || typeof error !== 'object') {
    toast.error('An unexpected error occurred')
    return
  }

  // Handle error objects that might come from API responses
  let apiError: ApiError | null = null

  // Check if error has a response property (axios-like error)
  if (
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    apiError = error.response.data as ApiError
  }
  // Check if error is directly an API error object
  else if ('error' in error || 'errors' in error) {
    apiError = error as ApiError
  }
  // Handle Error instances
  else if (error instanceof Error) {
    toast.error(error.message)
    return
  }

  if (!apiError) {
    toast.error('An unexpected error occurred')
    return
  }

  // Show validation errors as individual toasts
  if (
    apiError.errors &&
    Array.isArray(apiError.errors) &&
    apiError.errors.length > 0
  ) {
    apiError.errors.forEach((validationError) => {
      toast.error(`${validationError.field}: ${validationError.message}`)
    })
  }
  // Show general error message if no specific validation errors
  else if (apiError.error) {
    toast.error(apiError.error)
  }
  // Fallback
  else {
    toast.error('An unexpected error occurred')
  }
}
