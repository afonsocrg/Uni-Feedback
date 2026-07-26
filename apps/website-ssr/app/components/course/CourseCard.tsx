import {
  Button,
  Chip,
  StarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { useNavigate } from 'react-router'
import { SelectionCard } from '~/components'
import { useLang, useWorkloadLabel } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getCourseFeedbackPath } from '~/utils/i18n-routes'
import { RowTag } from '../common/RowTag'
import type { CourseTermTag } from './types'

interface CourseCardProps {
  courseId: number
  acronym: string
  name: string
  /**
   * Terms the course runs in, when narrower than its section's own. Empty for a
   * course running the section's whole term, or outside a grouped listing.
   */
  terms?: CourseTermTag[]
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
  useAcronymAsTitle?: boolean
  hasMandatoryExam?: boolean | null
  isMandatory?: boolean | null
  href?: string
  showAverageScores?: boolean
  /**
   * Rank of this card in the rendered listing (0-based, flat across sections),
   * for the `course_card_clicked` event. Optional so cards used outside a
   * ranked listing (e.g. recommendations) can omit it.
   */
  positionInList?: number
}

export function CourseCard({
  courseId,
  acronym,
  name,
  terms = [],
  averageRating,
  averageWorkload,
  totalFeedbackCount,
  useAcronymAsTitle = false,
  hasMandatoryExam,
  isMandatory,
  href,
  showAverageScores = false,
  positionInList
}: CourseCardProps) {
  const navigate = useNavigate()
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()
  const title = useAcronymAsTitle ? acronym : name
  const subtitle = useAcronymAsTitle ? name : acronym

  // Both tags flag only the exception, so the common case stays clean: a term
  // narrower than the section's (no tag means the course runs all of it), and
  // `isMandatory === false`, a known elective. `isMandatory` is nullable and
  // mandatory is the default expectation in a degree plan, so only false earns a
  // tag. The term sits right after the acronym and carries a hashed colour, as
  // it does on a `CourseTable` row.
  const subtitleNode =
    terms.length > 0 || isMandatory === false ? (
      <span className="inline-flex items-center gap-2">
        {subtitle}
        {terms.map((term) => (
          <Chip
            key={term.label}
            label={term.label}
            color={term.color}
            size="xs"
          />
        ))}
        {isMandatory === false && <RowTag label="Optional" />}
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
      onClick={() => {
        // Core "consumer browses a course" signal, and the entry point of any
        // consumer-to-contributor funnel. Fires on the card body; the "give the
        // first feedback" button below stops propagation, so a review-intent
        // click is not counted here as a browse. Runs before the anchor's
        // navigation because the click bubbles up to this handler first.
        analytics.discovery.courseCardClicked({
          courseId,
          sourcePage: getPageName(window.location.pathname),
          positionInList: positionInList ?? -1
        })
      }}
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
                      label={workloadLabel(Number(averageWorkload || 0))}
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
