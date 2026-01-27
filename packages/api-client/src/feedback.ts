import { type ReportCategory } from '@uni-feedback/db/schema'
import { MeicFeedbackAPIError } from './errors'
import { apiDelete, apiGet, apiPost, apiPut } from './utils'

// Re-export report category types from db package
export {
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  type ReportCategory
} from '@uni-feedback/db/schema'

export type ReportFeedbackRequest = {
  category: ReportCategory
  details: string
}

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

export type FeedbackForEdit = {
  id: number
  userId: number
  rating: number
  workloadRating: number
  comment: string | null
  schoolYear: number | null
  approvedAt: string | null
  courseName: string
  courseCode: string
  courseId: number
  facultyShortName: string
}

export type GetFeedbackForEditResponse = {
  feedback: FeedbackForEdit
}

export async function getFeedbackForEdit(
  feedbackId: number
): Promise<GetFeedbackForEditResponse> {
  try {
    return await apiGet<GetFeedbackForEditResponse>(
      `/feedback/${feedbackId}/edit`
    )
  } catch (error) {
    throw new MeicFeedbackAPIError(
      error instanceof Error ? error.message : 'Failed to fetch feedback'
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

// Helpful vote types and functions
export type HelpfulVoteResponse = {
  message: string
}

export async function addHelpfulVote(
  feedbackId: number
): Promise<HelpfulVoteResponse> {
  try {
    return await apiPost(`/feedback/${feedbackId}/helpful`, {})
  } catch (error) {
    throw new MeicFeedbackAPIError(
      `Failed to add helpful vote: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function removeHelpfulVote(
  feedbackId: number
): Promise<HelpfulVoteResponse> {
  try {
    return await apiDelete(`/feedback/${feedbackId}/helpful`)
  } catch (error) {
    throw new MeicFeedbackAPIError(
      `Failed to remove helpful vote: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// Report types and functions
export type ReportFeedbackResponse = {
  message: string
}

export async function reportFeedback(
  feedbackId: number,
  data: ReportFeedbackRequest
): Promise<ReportFeedbackResponse> {
  try {
    return await apiPost(`/feedback/${feedbackId}/report`, data)
  } catch (error) {
    throw new MeicFeedbackAPIError(
      `Failed to report feedback: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
