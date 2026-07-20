import { Button, StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'
import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { FeedbackMarkdown, Tooltip } from '~/components'
import { useLang, useWorkloadLabel } from '~/hooks'
import { getTruncatedText } from '~/lib/textUtils'

interface SimpleFeedbackCardProps {
  feedback: {
    rating: number
    workloadRating: number | null
    comment: string | null
    createdAt: string
    isFromDifferentCourse?: number | boolean
    degree?: {
      id: number
      name: string
      acronym: string
    }
  }
}

export function SimpleFeedbackCard({ feedback }: SimpleFeedbackCardProps) {
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()
  const [isExpanded, setIsExpanded] = useState(false)
  const characterLimit = 600
  const isLongComment =
    feedback.comment && feedback.comment.length > characterLimit
  const relativeTime = getRelativeTime(new Date(feedback.createdAt), lang)

  return (
    <div className="bg-card rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-6 mb-6 hover:shadow-[0px_6px_24px_rgba(0,0,0,0.08)] transition-shadow">
      {/* Header with rating and date */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={feedback.rating} />
            {feedback.workloadRating && (
              <div className="inline-flex items-center px-3 py-1 text-xs text-muted-foreground font-medium">
                <span className="mr-1">Workload:</span>
                <WorkloadRatingDisplay
                  rating={feedback.workloadRating}
                  label={workloadLabel(feedback.workloadRating)}
                />
              </div>
            )}
            {feedback.isFromDifferentCourse && feedback.degree && (
              <Tooltip
                content={`Feedback submitted by a student from ${feedback.degree.name}`}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-tint-blue-border bg-tint-blue text-tint-blue-fg">
                  <GraduationCap className="w-3 h-3 mr-1.5" />
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
        <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
          <div className="transition-all duration-300 ease-in-out">
            <FeedbackMarkdown>
              {isLongComment && !isExpanded
                ? getTruncatedText(feedback.comment, characterLimit) + '...'
                : feedback.comment}
            </FeedbackMarkdown>
          </div>
          {isLongComment && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 p-0 h-auto text-sm"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground italic text-sm">
          This user did not leave any comment
        </p>
      )}
    </div>
  )
}
