import { MeicFeedbackAPIError } from './errors'
import { apiDelete, apiPost, apiPut } from './utils'

// Authentication required - email comes from user session
export type CreateFeedbackRequest = {
  schoolYear: number
  courseId: number
  rating: number
  workloadRating: number
  comment?: string
}

export type CreateFeedbackResponse = {
  message: string
  pointsEarned: number
}

export type FeedbackCategories = {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
}

export type CategorizeFeedbackResponse = {
  categories: FeedbackCategories
}

export async function categorizeFeedbackPreview(
  comment: string
): Promise<FeedbackCategories> {
  try {
    const response: CategorizeFeedbackResponse = await apiPost(
      '/feedback/categorize-preview',
      { comment }
    )
    return response.categories
  } catch (error) {
    throw new MeicFeedbackAPIError(
      `Failed to categorize feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function submitFeedback({
  schoolYear,
  courseId,
  rating,
  workloadRating,
  comment
}: CreateFeedbackRequest): Promise<CreateFeedbackResponse> {
  try {
    return await apiPost(`/courses/${courseId}/feedback`, {
      schoolYear,
      rating,
      workloadRating,
      comment
    })
  } catch (error) {
    if (error instanceof MeicFeedbackAPIError) {
      // Re-throw MeicFeedbackAPIError as is
      throw error
    }
    throw new MeicFeedbackAPIError(
      `Failed to submit feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export type EditFeedbackRequest = {
  rating: number
  workloadRating: number
  comment?: string
}

export type FeedbackAnalysis = {
  feedbackId: number
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
  wordCount: number
  createdAt: string
  reviewedAt: string | null
  updatedAt: string
}

export type EditFeedbackResponse = {
  message: string
  feedback: {
    id: number
    userId: number | null
    email: string | null
    schoolYear: number | null
    courseId: number
    rating: number
    workloadRating: number | null
    comment: string | null
    originalComment: string | null
    approvedAt: string | null
    createdAt: string | null
    updatedAt: string | null
  }
  analysis: FeedbackAnalysis | null
  points: number
}

export async function editFeedback(
  feedbackId: number,
  data: EditFeedbackRequest
): Promise<EditFeedbackResponse> {
  try {
    return await apiPut(`/feedback/${feedbackId}`, data)
  } catch (error) {
    throw new MeicFeedbackAPIError(
      `Failed to edit feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export type DeleteFeedbackResponse = {
  message: string
}

export async function deleteFeedback(
  feedbackId: number
): Promise<DeleteFeedbackResponse> {
  try {
    return await apiDelete(`/feedback/${feedbackId}`)
  } catch (error) {
    throw new MeicFeedbackAPIError(
      `Failed to delete feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
