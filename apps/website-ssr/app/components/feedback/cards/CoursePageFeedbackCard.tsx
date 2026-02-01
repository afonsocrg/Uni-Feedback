import { Button, StarRating, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'
import { Flag, GraduationCap, Link } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  FeedbackMarkdown,
  HelpfulVoteButton,
  ReportFeedbackDialog,
  Tooltip
} from '~/components'
import { getTruncatedText } from '~/lib/textUtils'
import { analytics } from '~/utils/analytics'

interface CourseFeedback {
  id: number
  courseId: number
  rating: number
  workloadRating: number | null
  comment: string | null
  createdAt: string
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasBeenViewedRef = useRef(false)

  const characterLimit = 600
  const isLongComment =
    feedback.comment && feedback.comment.length > characterLimit
  const relativeTime = getRelativeTime(new Date(feedback.createdAt))

  const feedbackAnchorId = `feedback-${feedback.id}`

  const handleCopyPermalink = async () => {
    try {
      const permalink = `${window.location.origin}/courses/${feedback.courseId}#${feedbackAnchorId}`
      await navigator.clipboard.writeText(permalink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy permalink:', error)
    }
  }

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
  }, [feedback.id])

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

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [feedback.id, feedback.courseId])

  return (
    <div
      id={feedbackAnchorId}
      ref={cardRef}
      className={`bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-6 mb-6 hover:shadow-[0px_6px_24px_rgba(0,0,0,0.08)] transition-all duration-500 ${
        isHighlighted
          ? 'ring-2 ring-primaryBlue ring-offset-2 shadow-[0px_8px_32px_rgba(35,114,159,0.15)]'
          : ''
      }`}
    >
      {/* Header with rating and date */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <StarRating value={feedback.rating} />
            {feedback.workloadRating && (
              <div className="inline-flex items-center px-3 py-1 text-xs text-gray-500 font-medium">
                <span className="mr-1">Workload:</span>
                <WorkloadRatingDisplay rating={feedback.workloadRating} />
              </div>
            )}
            {feedback.isFromDifferentCourse && (
              <Tooltip
                content={`Feedback submitted by a student from ${feedback.degree.name}`}
              >
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700">
                  <GraduationCap className="w-3 h-3 mr-1.5" />
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
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
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
        <p className="text-gray-500 italic text-sm">
          This user did not leave any comment
        </p>
      )}

      {/* Footer with actions */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <HelpfulVoteButton
          feedbackId={feedback.id}
          initialVoteCount={feedback.helpfulVoteCount}
          initialHasVoted={feedback.hasVoted}
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyPermalink}
            className="h-8 px-2 text-gray-400 hover:text-gray-600"
          >
            {isCopied && (
              <span className="text-xs font-medium mr-1">Copied!</span>
            )}
            <Link className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReportDialogOpen(true)}
            className="h-8 px-2 text-gray-400 hover:text-gray-600"
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
    </div>
  )
}
