import { StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'
import { GraduationCap } from 'lucide-react'
import { FeedbackMarkdown, Tooltip } from '~/components'
import { useLang, useWorkloadLabel } from '~/hooks'

interface ReportFeedbackFeedbackCardProps {
  feedback: {
    rating: number
    workloadRating: number | null
    comment: string | null
    createdAt: Date | string | null
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
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()
  const relativeTime = feedback.createdAt
    ? getRelativeTime(new Date(feedback.createdAt), lang)
    : ''

  return (
    <div className="bg-muted/50 border rounded-lg p-4 max-h-48 overflow-y-auto">
      {/* Header with rating */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <StarRating value={feedback.rating} size="sm" />
            {feedback.workloadRating && (
              <div className="inline-flex items-center text-xs text-muted-foreground font-medium">
                <span className="mr-1">Workload:</span>
                <WorkloadRatingDisplay
                  rating={feedback.workloadRating}
                  label={workloadLabel(feedback.workloadRating)}
                />
              </div>
            )}
            {feedback.isFromDifferentCourse && (
              <Tooltip
                content={`Feedback submitted by a student from ${feedback.degree.name}`}
              >
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-tint-blue-border bg-tint-blue text-tint-blue-fg">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  {feedback.degree.acronym}
                </div>
              </Tooltip>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{relativeTime}</p>
        </div>
      </div>

      {/* Comment section */}
      {feedback.comment ? (
        <FeedbackMarkdown>{feedback.comment}</FeedbackMarkdown>
      ) : (
        <p className="text-muted-foreground italic text-sm">
          This user did not leave any comment
        </p>
      )}
    </div>
  )
}
