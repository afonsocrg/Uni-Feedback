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
        requestId: error.requestId
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
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'DELETE',
    ...options
  })
  return response.json()
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
