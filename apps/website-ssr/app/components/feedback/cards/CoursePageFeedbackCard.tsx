import { Button, StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'
import { Flag, GraduationCap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FeedbackMarkdown,
  FeedbackShareButton,
  HelpfulVoteButton,
  ReportFeedbackDialog,
  Tooltip
} from '~/components'
import { useLang } from '~/hooks'
import { getTruncatedText, hasText } from '~/lib/textUtils'
import { cn } from '~/utils'
import { analytics } from '~/utils/analytics'

export interface CourseFeedback {
  id: number
  courseId: number
  rating: number
  workloadRating: number | null
  comment: string | null
  createdAt: Date | string | null
  schoolYear?: number | null
  isFromDifferentCourse: number
  helpfulVoteCount: number
  hasVoted: boolean
  degree: {
    id: number
    name: string
    acronym: string
  }
}

interface CoursePageFeedbackCardProps {
  feedback: CourseFeedback
}

export function CoursePageFeedbackCard({
  feedback
}: CoursePageFeedbackCardProps) {
  const { t } = useTranslation('course')
  const lang = useLang()
  const { t: tCommon } = useTranslation('common')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasBeenViewedRef = useRef(false)

  const characterLimit = 600
  const comment = hasText(feedback.comment) ? feedback.comment : null
  const isLongComment = comment && comment.length > characterLimit
  const relativeTime = feedback.createdAt
    ? getRelativeTime(new Date(feedback.createdAt), lang)
    : ''

  const feedbackAnchorId = `feedback-${feedback.id}`

  // Scroll to and highlight feedback if it matches the URL anchor
  useEffect(() => {
    const hash = window.location.hash

    if (hash === `#${feedbackAnchorId}` && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'instant',
        block: 'center'
      })
      setIsHighlighted(true)

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setIsHighlighted(false)
      }, 3000)
    }
  }, [feedback.id, feedbackAnchorId])

  // Track when feedback item becomes visible (intersection observer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenViewedRef.current) {
          analytics.feedback.itemViewed({
            feedbackId: feedback.id,
            courseId: feedback.courseId
          })
          hasBeenViewedRef.current = true
        }
      },
      { threshold: 0.5 } // Trigger when 50% of card is visible
    )

    const card = cardRef.current
    if (card) {
      observer.observe(card)
    }

    return () => {
      if (card) {
        observer.unobserve(card)
      }
    }
  }, [feedback.id, feedback.courseId])

  // Shared by both header layouts below, so the two never drift apart.
  const workload = feedback.workloadRating ? (
    <div
      // The badge hugs its label, but the box holding it is fixed once the row
      // is horizontal, so the degree chip starts at the same x on every card.
      // 176px clears the widest label ("Muito pesada", 162px).
      className="inline-flex items-center px-3 py-1 text-xs text-muted-foreground font-medium sm:w-44"
    >
      <span className="mr-1">{t('card.workload_prefix')}</span>
      <WorkloadRatingDisplay
        rating={feedback.workloadRating}
        label={
          (tCommon('workload_ratings', { returnObjects: true }) as string[])[
            Math.round(feedback.workloadRating) - 1
          ]
        }
      />
    </div>
  ) : null

  const degreeChip = feedback.isFromDifferentCourse ? (
    <Tooltip
      content={t('card.from_different_course', {
        degreeName: feedback.degree.name
      })}
    >
      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-tint-blue-border bg-tint-blue text-tint-blue-fg">
        <GraduationCap className="w-3 h-3 mr-1.5" />
        {feedback.degree.acronym}
      </div>
    </Tooltip>
  ) : null

  const timestamp = (
    <p className="text-xs text-muted-foreground">{relativeTime}</p>
  )

  return (
    <div
      id={feedbackAnchorId}
      ref={cardRef}
      className={cn(
        'bg-card rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]',
        'hover:shadow-[0px_6px_24px_rgba(0,0,0,0.08)] transition-all duration-500',
        // A rating-only card is a single row of chips, so it drops the footer
        // actions and the padding that a comment would need.
        comment ? 'p-6 mb-6' : 'px-6 py-4 mb-3',
        isHighlighted &&
          'ring-2 ring-primaryBlue ring-offset-2 shadow-[0px_8px_32px_rgba(35,114,159,0.15)]'
      )}
    >
      {/* Header with rating and date */}
      <div className={comment ? 'mb-6' : ''}>
        {comment ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <StarRating value={feedback.rating} />
              {workload}
              {degreeChip}
            </div>
            {timestamp}
          </div>
        ) : (
          /* A rating-only card is short enough to fit one desktop row. On mobile
             it becomes a 2x2 grid: stars / workload above, degree / date below. */
          <div
            className={cn(
              'grid grid-cols-[auto_1fr] items-center gap-y-2',
              'sm:flex sm:flex-wrap sm:items-center sm:gap-x-3'
            )}
          >
            <StarRating value={feedback.rating} />
            {workload && (
              <div className="col-start-2 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto sm:justify-self-auto">
                {workload}
              </div>
            )}
            {degreeChip && (
              <div className="col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto">
                {degreeChip}
              </div>
            )}
            <div
              className={cn(
                'col-start-2 justify-self-end',
                // Row 1 is only free when nothing else claims it: the workload
                // sits there, and the degree chip forces a second row anyway.
                degreeChip || workload ? 'row-start-2' : 'row-start-1',
                'sm:col-start-auto sm:row-start-auto sm:ml-auto'
              )}
            >
              {timestamp}
            </div>
          </div>
        )}
      </div>

      {/* Comment section */}
      {comment && (
        <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
          <div className="transition-all duration-300 ease-in-out">
            <FeedbackMarkdown>
              {isLongComment && !isExpanded
                ? getTruncatedText(comment, characterLimit) + '...'
                : comment}
            </FeedbackMarkdown>
          </div>
          {isLongComment && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 p-0 h-auto text-sm"
            >
              {isExpanded ? t('card.show_less') : t('card.show_more')}
            </Button>
          )}
        </div>
      )}

      {/* Footer with actions. There is nothing to vote on, share, or report
          on a review with no comment, so rating-only cards omit it. */}
      {comment && (
        <>
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <HelpfulVoteButton
              feedbackId={feedback.id}
              initialVoteCount={feedback.helpfulVoteCount}
              initialHasVoted={feedback.hasVoted}
            />
            <div className="flex items-center gap-1">
              <FeedbackShareButton
                feedbackId={feedback.id}
                courseId={feedback.courseId}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReportDialogOpen(true)}
                className="h-8 px-2 text-muted-foreground hover:text-muted-foreground"
              >
                <Flag className="size-4" />
              </Button>
            </div>
          </div>

          <ReportFeedbackDialog
            feedback={feedback}
            open={isReportDialogOpen}
            onOpenChange={setIsReportDialogOpen}
          />
        </>
      )}
    </div>
  )
}
