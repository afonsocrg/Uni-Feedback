import { useQueryClient } from '@tanstack/react-query'
import { deleteFeedback } from '@uni-feedback/api-client'
import {
  Button,
  Chip,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  StarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'
import { ExternalLink, HelpCircle, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { FeedbackCategoryChips, FeedbackMarkdown } from '~/components'
import { useLang, useWorkloadLabel } from '~/hooks'
import { getTruncatedText } from '~/lib/textUtils'
import { analytics } from '~/utils/analytics'
import {
  getFeedbackAnchor,
  getFeedbackEditPath,
  getLocalePath
} from '~/utils/i18n-routes'

interface ProfileFeedbackCardProps {
  feedback: {
    id: number
    courseId: number
    courseName: string
    courseCode: string
    approvedAt: string | null
    schoolYear: number | null
    rating: number
    workloadRating: number | null
    comment: string | null
    analysis: {
      hasTeaching: boolean
      hasAssessment: boolean
      hasMaterials: boolean
      hasTips: boolean
    } | null
    points: number | null
    createdAt: string
    updatedAt: string
  }
}

export function ProfileFeedbackCard({ feedback }: ProfileFeedbackCardProps) {
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()
  const { t } = useTranslation('feedback')

  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const characterLimit = 600
  const isLongComment =
    feedback.comment && feedback.comment.length > characterLimit
  const relativeTime = getRelativeTime(new Date(feedback.createdAt), lang)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteFeedback(feedback.id)
      toast.success(t('feedback_card.toast_deleted'))
      setIsDeleteDialogOpen(false)
      // Invalidate queries to refresh the feedback list and stats
      await queryClient.invalidateQueries({ queryKey: ['user', 'feedback'] })
      await queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('feedback_card.toast_delete_failed')
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-card rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-6 mb-6 hover:shadow-[0px_6px_24px_rgba(0,0,0,0.08)] transition-shadow">
      {/* Header */}
      <div className="mb-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-semibold">{feedback.courseName}</span>
            {!feedback.approvedAt && (
              <Chip
                color="red"
                label={t('feedback_card.removed_by_moderators')}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {relativeTime}
          </p>
        </div>
        {/* Rating, Workload */}
        <div className="flex flex-wrap items-center gap-4">
          <StarRating value={feedback.rating} size="sm" />
          {feedback.workloadRating && (
            <div className="inline-flex items-center text-xs text-muted-foreground font-medium">
              <span className="mr-1">{t('feedback_card.workload')}</span>
              <WorkloadRatingDisplay
                rating={feedback.workloadRating}
                label={workloadLabel(feedback.workloadRating)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
        {feedback.comment ? (
          <>
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
                {isExpanded
                  ? t('feedback_card.show_less')
                  : t('feedback_card.show_more')}
              </Button>
            )}
          </>
        ) : (
          <p className="text-muted-foreground italic text-sm pl-4">
            {t('feedback_card.no_comment')}
          </p>
        )}
      </div>

      {/* Footer: points earned on the left, actions on the right, laid out like
          the course page card so the two surfaces read the same. */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3">
        {feedback.points !== null && feedback.points > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer">
                <span>
                  {t('feedback_card.points_short', {
                    count: feedback.points
                  })}
                </span>
                <HelpCircle className="size-4 text-muted-foreground" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <p className="text-sm font-medium">
                  {t('feedback_card.earned_points', {
                    count: feedback.points
                  })}
                </p>
                {feedback.analysis && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t('feedback_card.categories_covered')}
                    </p>
                    <FeedbackCategoryChips
                      orientation="vertical"
                      categories={{
                        hasTeaching: feedback.analysis.hasTeaching,
                        hasAssessment: feedback.analysis.hasAssessment,
                        hasMaterials: feedback.analysis.hasMaterials,
                        hasTips: feedback.analysis.hasTips
                      }}
                      isLoading={false}
                    />
                  </div>
                )}
                <Link
                  to={getLocalePath('points', lang)}
                  className="text-sm text-primary hover:underline inline-block"
                >
                  {t('feedback_card.learn_more_points')}
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        )}
        {/* ml-auto, not justify-between alone: a review with no points has no
            left-hand element to push against. */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-muted-foreground"
          >
            <Link
              to={getFeedbackEditPath(lang, feedback.id)}
              title={t('feedback_card.edit')}
              aria-label={t('feedback_card.edit')}
              onClick={() =>
                analytics.feedback.editClicked({
                  feedbackId: feedback.id,
                  courseId: feedback.courseId,
                  surface: 'profile'
                })
              }
            >
              <Pencil className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-muted-foreground"
          >
            {/* Deep link to this review on the course page, not just the course:
                the student lands on their own comment, highlighted. */}
            <Link
              to={getFeedbackAnchor(lang, feedback.courseId, feedback.id)}
              target="_blank"
              rel="noopener noreferrer"
              title={t('feedback_card.open_course_page')}
              aria-label={t('feedback_card.open_course_page')}
              onClick={() =>
                analytics.feedback.viewOnCoursePageClicked({
                  feedbackId: feedback.id,
                  courseId: feedback.courseId
                })
              }
            >
              <ExternalLink className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            title={t('feedback_card.delete')}
            aria-label={t('feedback_card.delete')}
            className="h-8 px-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('feedback_card.delete_dialog_title')}</DialogTitle>
            <DialogDescription>
              {t('feedback_card.delete_dialog_desc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                {t('feedback_card.delete_cancel')}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? t('feedback_card.delete_deleting')
                : t('feedback_card.delete_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
