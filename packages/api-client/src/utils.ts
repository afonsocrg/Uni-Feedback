import { API_BASE_URL } from './config'
import { MeicFeedbackAPIError } from './errors'

interface ApiOptions {
  requiresAuth?: boolean
}

/**
 * Base fetch wrapper with common configuration
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit & ApiOptions = {}
): Promise<Response> {
  const { requiresAuth = true, ...fetchOptions } = options

  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json'
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers
    }
  }

  // Include credentials for authenticated requests
  if (requiresAuth) {
    config.credentials = 'include'
  }

  const response = await fetch(url, config)

  // Handle 401 Unauthorized errors with token refresh
  if (response.status === 401 && requiresAuth) {
    try {
      // Attempt to refresh the access token
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      if (refreshResponse.ok) {
        // Retry the original request with the new token
        const retryResponse = await fetch(url, config)

        if (!retryResponse.ok) {
          const error = await retryResponse
            .json()
            .catch(() => ({ error: 'Request failed' }))
          throw new Error(
            error.error || `Request failed with status ${retryResponse.status}`
          )
        }

        return retryResponse
      }
    } catch {
      // If refresh fails, fall through to original error handling
    }
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }))
    if (error.error) {
      throw new MeicFeedbackAPIError(error.error, {
        status: response.status,
        requestId: error.requestId,
        data: error.data
      })
    }
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response
}

/**
 * GET request wrapper
 */
export async function apiGet<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'GET',
    ...options
  })
  return response.json()
}

/**
 * POST request wrapper
 */
export async function apiPost<T>(
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options
  })
  return response.json()
}

/**
 * PUT request wrapper
 */
export async function apiPut<T>(
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options
  })
  return response.json()
}

/**
 * DELETE request wrapper
 */
export async function apiDelete<T>(
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
    ...options
  })
  return response.json()
}

/**
 * Extract filename from Content-Disposition header
 */
function extractFilename(contentDisposition: string | null): string {
  if (!contentDisposition) return 'download.csv'

  // Try to match filename="value" or filename=value
  const filenameMatch = contentDisposition.match(
    /filename[^;=\n]*=["']?([^"';\n]*)["']?/
  )
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1].trim()
  }

  // Try to match filename*=UTF-8''value (RFC 5987)
  const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
  if (filenameStarMatch && filenameStarMatch[1]) {
    return decodeURIComponent(filenameStarMatch[1].trim())
  }

  return 'download.csv'
}

/**
 * POST request wrapper that returns a Blob with filename (for file downloads)
 */
export async function apiPostBlob(
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options
  })

  const contentDisposition = response.headers.get('Content-Disposition')
  const filename = extractFilename(contentDisposition)
  const blob = await response.blob()

  return { blob, filename }
}

/**
 * POST request wrapper that doesn't return JSON (for logout, etc.)
 */
export async function apiPostVoid(
  endpoint: string,
  data?: any,
  options: ApiOptions = {}
): Promise<void> {
  await apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options
  })
}
