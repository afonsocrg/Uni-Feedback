import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EditableStarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { formatSchoolYearString, getRelativeTime } from '@uni-feedback/utils'
import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang, useWorkloadLabel } from '~/hooks'
import { FeedbackMarkdown } from './feedback'

interface FeedbackDraftDialogProps {
  open: boolean
  draftTimestamp: number // Unix timestamp in ms
  rating: number
  workloadRating: number
  comment: string
  schoolYear?: number
  onRestore: () => void
  onDiscard: () => void
}

/**
 * Dialog shown when an existing feedback draft is detected
 * Allows user to restore the draft or start fresh
 */
export function FeedbackDraftDialog({
  open,
  draftTimestamp,
  rating,
  workloadRating,
  comment,
  schoolYear,
  onRestore,
  onDiscard
}: FeedbackDraftDialogProps) {
  const { t } = useTranslation('feedback')
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()
  const timeAgo = getRelativeTime(draftTimestamp, lang)
  const hasComment = comment.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDiscard()}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('draft.title')}</DialogTitle>
          <DialogDescription>{t('draft.desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Draft Preview */}
          <div className="space-y-4">
            {/* School Year - same order as the form */}
            {schoolYear !== undefined && (
              <div>
                <div className="text-sm font-medium text-foreground mb-2">
                  {t('draft.school_year')}
                </div>
                <div className="text-sm text-foreground">
                  {formatSchoolYearString(schoolYear, { yearFormat: 'short' })}
                </div>
              </div>
            )}

            {/* Ratings - side by side with flex-wrap */}
            <div className="flex flex-wrap gap-6">
              {/* Rating */}
              {rating > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-medium text-foreground mb-2">
                    {t('draft.rating')}
                  </div>
                  <EditableStarRating
                    value={rating}
                    onChange={() => {}}
                    disabled={true}
                    size="md"
                    labelFunction={(rating) =>
                      (
                        t('form.star_ratings', {
                          returnObjects: true
                        }) as string[]
                      )[rating - 1] ?? ''
                    }
                  />
                </div>
              )}

              {/* Workload Rating */}
              {workloadRating > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-medium text-foreground mb-2">
                    {t('draft.workload')}
                  </div>
                  <WorkloadRatingDisplay
                    rating={workloadRating}
                    label={workloadLabel(workloadRating)}
                  />
                </div>
              )}
            </div>

            {/* Comment - always shown */}
            <div>
              <div className="text-sm font-medium text-foreground mb-2">
                {t('draft.comment')}
              </div>
              <div className="text-sm text-foreground max-h-[200px] overflow-y-auto">
                {hasComment ? (
                  <FeedbackMarkdown>{comment}</FeedbackMarkdown>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t('draft.no_comment')}
                  </p>
                )}
              </div>
            </div>

            {/* Timestamp - secondary information */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{t('draft.last_saved', { timeAgo })}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="flex-1 sm:flex-1"
          >
            {t('draft.discard')}
          </Button>
          <Button onClick={onRestore} className="flex-1 sm:flex-1">
            {t('draft.restore')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
