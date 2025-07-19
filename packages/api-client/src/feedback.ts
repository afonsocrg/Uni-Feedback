import { API_BASE_URL } from './config'
import { MeicFeedbackAPIError } from './errors'
import { Feedback } from './types'

export type FeedbackSubmission = Omit<Feedback, 'id' | 'createdAt'>

export async function submitFeedback({
  email,
  schoolYear,
  courseId,
  rating,
  workloadRating,
  comment
}: FeedbackSubmission) {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ email, schoolYear, rating, workloadRating, comment })
  })
  if (!response.ok) {
    const { error } = await response.json()
    throw new MeicFeedbackAPIError(`Failed to submit feedback: ${error}`)
  }
  return response.json()
}
