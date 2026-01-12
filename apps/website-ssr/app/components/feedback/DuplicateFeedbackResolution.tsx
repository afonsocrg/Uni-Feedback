import { type DuplicateFeedbackDetail } from '@uni-feedback/api-client'
import { CoursePageFeedbackCard } from './CoursePageFeedbackCard'
import {
  InlineFeedbackEdit,
  type EditFeedbackFormData
} from './InlineFeedbackEdit'

interface DuplicateFeedbackResolutionProps {
  existingFeedback: DuplicateFeedbackDetail
  pendingFeedbackData: {
    facultyId: number
    degreeId: number
    rating: number
    workloadRating: number
    comment?: string
  } | null
  onSubmit: (values: EditFeedbackFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function DuplicateFeedbackResolution({
  existingFeedback,
  pendingFeedbackData,
  onSubmit,
  onCancel,
  isSubmitting
}: DuplicateFeedbackResolutionProps) {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          You've already reviewed {existingFeedback.course.name}
        </h1>

        <p className="text-gray-600 mb-6">
          You can update your existing feedback with these changes or cancel.
        </p>

        {/* Show existing feedback card */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Your Current Feedback
          </h2>
          <CoursePageFeedbackCard feedback={existingFeedback} />
        </div>

        {/* Inline edit form - pre-filled with the NEW data user just submitted */}
        <InlineFeedbackEdit
          initialValues={{
            rating: pendingFeedbackData?.rating,
            workloadRating: pendingFeedbackData?.workloadRating,
            comment: pendingFeedbackData?.comment || null
          }}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </main>
  )
}
