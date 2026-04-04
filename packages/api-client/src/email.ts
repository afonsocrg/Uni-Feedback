import { apiPost } from './utils'

export interface UnsubscribeRequest {
  token: string
}

export interface UnsubscribeResponse {
  message: string
}

/**
 * Unsubscribe from reminder emails using a token
 */
export async function unsubscribeFromReminders(
  data: UnsubscribeRequest
): Promise<UnsubscribeResponse> {
  return apiPost<UnsubscribeResponse>(
    `/email/unsubscribe?token=${encodeURIComponent(data.token)}`,
    undefined,
    { requiresAuth: false }
  )
}
