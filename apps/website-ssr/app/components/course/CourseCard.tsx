import { Button, StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { useNavigate } from 'react-router'
import { SelectionCard } from '~/components'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getCourseFeedbackPath } from '~/utils/i18n-routes'

interface CourseCardProps {
  courseId: number
  acronym: string
  name: string
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
  useAcronymAsTitle?: boolean
  hasMandatoryExam?: boolean | null
  isMandatory?: boolean | null
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
  isMandatory,
  href,
  showAverageScores = false
}: CourseCardProps) {
  const navigate = useNavigate()
  const lang = useLang()
  const title = useAcronymAsTitle ? acronym : name
  const subtitle = useAcronymAsTitle ? name : acronym

  // `isMandatory` is nullable: only false (a known elective) earns a badge.
  // Mandatory is the default expectation in a degree plan, and most courses
  // have no data, so flagging only the exception keeps the cards clean.
  const subtitleNode =
    isMandatory === false ? (
      <span className="inline-flex items-center gap-2">
        {subtitle}
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Optional
        </span>
      </span>
    ) : (
      subtitle
    )

  return (
    <SelectionCard
      title={title}
      subtitle={subtitleNode}
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
              navigate(
                `${getCourseFeedbackPath(lang, courseId)}?from=course_card`
              )
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
              <span className="text-xs text-muted-foreground">
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
                  <span className="text-xs text-muted-foreground">
                    ({Number(averageRating || 0).toFixed(1)}/5)
                  </span>
                )}
                {Number(averageWorkload || 0) > 0 && (
                  <>
                    <WorkloadRatingDisplay
                      rating={Number(averageWorkload || 0)}
                    />
                    {showAverageScores && (
                      <span className="text-xs text-muted-foreground">
                        ({Number(averageWorkload || 0).toFixed(1)}/5)
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            {hasMandatoryExam && (
              <div className="self-end flex-shrink-0 text-xs text-muted-foreground text-right leading-[1.5]">
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
