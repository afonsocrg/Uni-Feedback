import { API_BASE_URL } from './config'
import { MeicFeedbackAPIError } from './errors'

export interface FeedbackDraftData {
  rating?: number
  workloadRating?: number
  comment?: string
}

export interface CreateFeedbackDraftResponse {
  code: string
  expiresAt: string
}

export async function createFeedbackDraft(
  data: FeedbackDraftData
): Promise<CreateFeedbackDraftResponse> {
  const response = await fetch(`${API_BASE_URL}/feedback-drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const { error } = await response.json()
    throw new MeicFeedbackAPIError(`Failed to create feedback draft: ${error}`)
  }

  return response.json()
}

export async function getFeedbackDraft(
  code: string
): Promise<FeedbackDraftData> {
  const response = await fetch(`${API_BASE_URL}/feedback-drafts/${code}`)

  if (!response.ok) {
    const { error } = await response.json()
    throw new MeicFeedbackAPIError(
      `Failed to get feedback draft data: ${error}`
    )
  }

  return response.json()
}
