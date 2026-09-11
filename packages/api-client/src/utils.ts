import { API_BASE_URL } from './config'
import { MeicFeedbackAPIError } from './errors'

interface ApiOptions {
  requiresAuth?: boolean
  skipDefaultHeaders?: boolean
}

/**
 * Fetch, and if the session has expired, refresh it and try once more.
 *
 * Access tokens live 15 minutes, so this is the difference between a student
 * being signed in and a student *appearing* to be signed out halfway through a
 * visit. Exported because `apiFetch` is not the only caller: the chat's answer
 * stream is a hand-written `fetch` (EventSource is GET-only and cannot send
 * credentials with a JSON body) and used to skip this entirely, which made the
 * second message of a long session fail with a generic error.
 *
 * Returns the response the caller should act on: the retry's when a refresh
 * happened, the original 401 otherwise. Deliberately does not interpret the
 * body, because callers disagree about what a body is. `apiFetch` parses JSON;
 * the chat reads an SSE stream.
 *
 * Safe to retry because `init.body` is a string rather than a consumed stream,
 * and because every route checks auth before writing anything to its response.
 */
export async function fetchWithRefresh(
  url: string,
  init: RequestInit
): Promise<Response> {
  const response = await fetch(url, init)
  if (response.status !== 401) return response

  const refreshed = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    signal: init.signal
  }).catch(() => null)

  // A failed refresh falls through to the original 401, so the caller reports
  // "not signed in" rather than whatever the refresh endpoint said.
  return refreshed?.ok ? fetch(url, init) : response
}

/**
 * Base fetch wrapper with common configuration
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit & ApiOptions = {}
): Promise<Response> {
  const {
    requiresAuth = true,
    skipDefaultHeaders = false,
    ...fetchOptions
  } = options

  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders: HeadersInit = skipDefaultHeaders
    ? {}
    : { 'Content-Type': 'application/json' }

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

  const response = requiresAuth
    ? await fetchWithRefresh(url, config)
    : await fetch(url, config)

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
 * POST request wrapper for multipart/form-data uploads.
 * Does NOT set Content-Type — the browser sets it automatically with the correct boundary.
 */
export async function apiPostFormData<T>(
  endpoint: string,
  formData: FormData,
  options: ApiOptions = {}
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: formData,
    skipDefaultHeaders: true,
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
