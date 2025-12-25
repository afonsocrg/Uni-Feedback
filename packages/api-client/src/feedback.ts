import { MeicFeedbackAPIError } from './errors'
import { Feedback } from './types'
import { apiPost } from './utils'

export type FeedbackSubmission = Omit<Feedback, 'id' | 'createdAt'>

export async function submitFeedback({
  email,
  schoolYear,
  courseId,
  rating,
  workloadRating,
  comment
}: FeedbackSubmission) {
  try {
    return await apiPost(`/courses/${courseId}/feedback`, {
      email,
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
