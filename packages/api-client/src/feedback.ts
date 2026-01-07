import { MeicFeedbackAPIError } from './errors'
import { apiPost } from './utils'

// Authentication required - email comes from user session
export type FeedbackSubmission = {
  schoolYear: number
  courseId: number
  rating: number
  workloadRating: number
  comment?: string
}

export type SubmitFeedbackResponse = {
  message: string
  pointsEarned: number
}

export async function submitFeedback({
  schoolYear,
  courseId,
  rating,
  workloadRating,
  comment
}: FeedbackSubmission): Promise<SubmitFeedbackResponse> {
  try {
    return await apiPost(`/courses/${courseId}/feedback`, {
      schoolYear,
      rating,
      workloadRating,
      comment
    })
  } catch (error) {
    throw new MeicFeedbackAPIError(
      `Failed to submit feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
