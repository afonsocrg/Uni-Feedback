import {
  MeicFeedbackAPIError,
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  type RequestOtpRequest,
  type VerifyOtpRequest,
  type VerifyOtpResponse
} from '@uni-feedback/api-client'

export interface RequestOtpResult {
  success: boolean
  retryAfterSeconds?: number
  error?: string
}

export interface VerifyOtpResult {
  success: boolean
  user?: VerifyOtpResponse['user']
  error?: string
  attemptsRemaining?: number
}

/**
 * Hook to manage OTP authentication flow
 */
export function useOtpAuth() {
  /**
   * Request an OTP code to be sent to the email
   * Returns success status and retryAfterSeconds if rate limited
   */
  const requestOtp = async (
    data: RequestOtpRequest
  ): Promise<RequestOtpResult> => {
    try {
      await apiRequestOtp(data)
      return { success: true }
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        if (error.status === 429) {
          // Rate limited - extract retryAfterSeconds from error data
          const retryAfterSeconds = (
            error.data as { retryAfterSeconds?: number }
          )?.retryAfterSeconds
          return {
            success: false,
            retryAfterSeconds,
            error: error.message
          }
        }
        return {
          success: false,
          error: error.message
        }
      }
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  /**
   * Verify the OTP code
   * Returns user data on success, or error with attemptsRemaining on failure
   */
  const verifyOtp = async (
    data: VerifyOtpRequest
  ): Promise<VerifyOtpResult> => {
    try {
      const response = await apiVerifyOtp(data)
      return {
        success: true,
        user: response.user
      }
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        const attemptsRemaining = (error.data as { attemptsRemaining?: number })
          ?.attemptsRemaining
        return {
          success: false,
          error: error.message,
          attemptsRemaining
        }
      }
      return {
        success: false,
        error: 'An unexpected error occurred'
      }
    }
  }

  return {
    requestOtp,
    verifyOtp
  }
}
