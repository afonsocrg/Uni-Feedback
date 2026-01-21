import { StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'
import { GraduationCap } from 'lucide-react'
import { FeedbackMarkdown, Tooltip } from '~/components'

interface ReportFeedbackFeedbackCardProps {
  feedback: {
    rating: number
    workloadRating: number | null
    comment: string | null
    createdAt: string
    isFromDifferentCourse: number
    degree: {
      id: number
      name: string
      acronym: string
    }
  }
}

export function ReportFeedbackFeedbackCard({
  feedback
}: ReportFeedbackFeedbackCardProps) {
  const relativeTime = getRelativeTime(new Date(feedback.createdAt))

  return (
    <div className="bg-muted/50 border rounded-lg p-4 max-h-48 overflow-y-auto">
      {/* Header with rating */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StarRating value={feedback.rating} size="sm" />
            {feedback.workloadRating && (
              <div className="inline-flex items-center text-xs text-gray-500 font-medium">
                <span className="mr-1">Workload:</span>
                <WorkloadRatingDisplay rating={feedback.workloadRating} />
              </div>
            )}
            {feedback.isFromDifferentCourse && (
              <Tooltip
                content={`Feedback submitted by a student from ${feedback.degree.name}`}
              >
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  {feedback.degree.acronym}
                </div>
              </Tooltip>
            )}
          </div>
          <p className="text-xs text-gray-400">{relativeTime}</p>
        </div>
      </div>

      {/* Comment section */}
      {feedback.comment ? (
        <FeedbackMarkdown>{feedback.comment}</FeedbackMarkdown>
      ) : (
        <p className="text-gray-500 italic text-sm">
          This user did not leave any comment
        </p>
      )}
    </div>
  )
}
