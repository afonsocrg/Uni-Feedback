import {
  MeicFeedbackAPIError,
  requestMagicLink as apiRequestMagicLink,
  useMagicLink as apiUseMagicLink,
  verifyMagicLinkByRequestId as apiVerifyMagicLinkByRequestId,
  type LoginResponse,
  type RequestMagicLinkRequest,
  type UseMagicLinkRequest,
  type VerifyMagicLinkResponse
} from '@uni-feedback/api-client'
import { STORAGE_KEYS, VERIFICATION_CONFIG } from '~/utils/constants'

interface StoredRequestIdData {
  requestId: string
  createdAt: number
}

/**
 * Hook to manage magic link authentication flow with automatic requestId handling
 */
export function useMagicLinkAuth() {
  /**
   * Get stored requestId if it's still fresh (within reuse window)
   * Automatically clears expired or invalid data
   */
  const getStoredRequestId = (): string | undefined => {
    const storedData = localStorage.getItem(STORAGE_KEYS.MAGIC_LINK_REQUEST_ID)

    if (!storedData) {
      return undefined
    }

    try {
      const parsed = JSON.parse(storedData) as StoredRequestIdData

      // Check if requestId is still fresh (within reuse window)
      const now = new Date()
      const reuseWindowStart = new Date(
        now.getTime() - VERIFICATION_CONFIG.REQUEST_ID_FRESHNESS_MS
      )

      if (parsed.createdAt > reuseWindowStart.getTime()) {
        return parsed.requestId
      } else {
        // Clear expired requestId
        localStorage.removeItem(STORAGE_KEYS.MAGIC_LINK_REQUEST_ID)
        return undefined
      }
    } catch {
      // Invalid JSON, clear it
      localStorage.removeItem(STORAGE_KEYS.MAGIC_LINK_REQUEST_ID)
      return undefined
    }
  }

  /**
   * Store requestId with current timestamp
   */
  const storeRequestId = (requestId: string): void => {
    const data: StoredRequestIdData = {
      requestId,
      createdAt: Date.now()
    }
    localStorage.setItem(
      STORAGE_KEYS.MAGIC_LINK_REQUEST_ID,
      JSON.stringify(data)
    )
  }

  /**
   * Clear stored requestId
   */
  const clearStoredRequestId = (): void => {
    localStorage.removeItem(STORAGE_KEYS.MAGIC_LINK_REQUEST_ID)
  }

  /**
   * Request a magic link with automatic requestId handling:
   * - Checks for fresh stored requestId and includes it
   * - Stores new requestId from response for polling
   * - Returns the API response
   */
  const requestMagicLink = async (
    data: Omit<RequestMagicLinkRequest, 'requestId'>
  ): Promise<{ message: string; requestId?: string }> => {
    // Check for stored requestId from expired link
    const storedRequestId = getStoredRequestId()

    // Call API with stored requestId if available
    const response = await apiRequestMagicLink({
      ...data,
      requestId: storedRequestId
    })

    // Store new requestId from response for polling
    if (response.requestId) {
      storeRequestId(response.requestId)
    }

    return response
  }

  /**
   * Use/consume magic link token with automatic requestId storage on failure:
   * - Calls the useMagicLink API endpoint (POST /auth/magic-links/use)
   * - If it fails with a MeicFeedbackAPIError that has a requestId, stores it
   * - Re-throws the error for the caller to handle
   */
  const useMagicLink = async (
    data: UseMagicLinkRequest
  ): Promise<LoginResponse> => {
    try {
      return await apiUseMagicLink(data)
    } catch (error) {
      // Check if this is an expired token with requestId
      if (error instanceof MeicFeedbackAPIError && error.requestId) {
        // Store requestId with timestamp for future use
        storeRequestId(error.requestId)
      }
      // Re-throw the error for the caller to handle
      throw error
    }
  }

  /**
   * Verify magic link by requestId (polling):
   * - Calls the verifyMagicLinkByRequestId API endpoint (POST /auth/magic-links/verify)
   * - Automatically uses the stored requestId (from previous requestMagicLink call)
   * - Used for polling to check if a magic link was used
   * - Throws error if no requestId is stored
   */
  const verifyMagicLinkByRequestId =
    async (): Promise<VerifyMagicLinkResponse> => {
      const storedRequestId = getStoredRequestId()

      if (!storedRequestId) {
        throw new Error(
          'No requestId available for polling. Please request a magic link first.'
        )
      }

      return await apiVerifyMagicLinkByRequestId({ requestId: storedRequestId })
    }

  return {
    getStoredRequestId,
    storeRequestId,
    clearStoredRequestId,
    requestMagicLink,
    useMagicLink,
    verifyMagicLinkByRequestId
  }
}
