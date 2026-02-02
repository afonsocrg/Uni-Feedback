import { Button, StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { useNavigate } from 'react-router'
import { SelectionCard } from '~/components'
import { analytics, getPageName } from '~/utils/analytics'

interface CourseCardProps {
  courseId: number
  acronym: string
  name: string
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
  useAcronymAsTitle?: boolean
  hasMandatoryExam?: boolean | null
  href?: string
  showAverageScores?: boolean
}

export function CourseCard({
  courseId,
  acronym,
  name,
  averageRating,
  averageWorkload,
  totalFeedbackCount,
  useAcronymAsTitle = false,
  hasMandatoryExam,
  href,
  showAverageScores = false
}: CourseCardProps) {
  const navigate = useNavigate()
  const title = useAcronymAsTitle ? acronym : name
  const subtitle = useAcronymAsTitle ? name : acronym

  return (
    <SelectionCard
      title={title}
      subtitle={subtitle}
      href={href}
      className="flex flex-col"
    >
      <div className="flex flex-col mt-auto">
        {totalFeedbackCount === 0 ? (
          <Button
            variant="link"
            className="p-0 h-auto text-xs justify-start"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              analytics.navigation.feedbackFormLinkClicked({
                source: 'course_card_first_feedback',
                referrerPage: getPageName(window.location.pathname),
                courseId
              })
              navigate(`/feedback/new?courseId=${courseId}`)
            }}
          >
            <span>
              Give the first
              <br />
              feedback!
            </span>
          </Button>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-xs text-gray-500">
                (
                {totalFeedbackCount === 1
                  ? '1 review'
                  : `${totalFeedbackCount} reviews`}
                )
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <StarRating
                  value={Number(averageRating || 0)}
                  size="sm"
                  showHalfStars
                />
                {showAverageScores && (
                  <span className="text-xs text-gray-400">
                    ({Number(averageRating || 0).toFixed(1)}/5)
                  </span>
                )}
                {Number(averageWorkload || 0) > 0 && (
                  <>
                    <WorkloadRatingDisplay
                      rating={Number(averageWorkload || 0)}
                    />
                    {showAverageScores && (
                      <span className="text-xs text-gray-400">
                        ({Number(averageWorkload || 0).toFixed(1)}/5)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            {hasMandatoryExam && (
              <div className="self-end flex-shrink-0 text-xs text-gray-500 text-right leading-[1.5]">
                📝 Exam
                <br />
                mandatory
              </div>
            )}
          </div>
        )}
      </div>
    </SelectionCard>
  )
}
