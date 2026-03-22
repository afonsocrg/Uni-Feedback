import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EditableStarRating,
  EditableWorkloadRating
} from '@uni-feedback/ui'
import { getRelativeTime } from '@uni-feedback/utils'
import { Clock } from 'lucide-react'
import { FeedbackMarkdown } from './feedback'

interface FeedbackDraftDialogProps {
  open: boolean
  draftTimestamp: number // Unix timestamp in ms
  rating: number
  workloadRating: number
  comment: string
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
  onRestore,
  onDiscard
}: FeedbackDraftDialogProps) {
  const timeAgo = getRelativeTime(draftTimestamp)
  const hasComment = comment.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDiscard()}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Draft Found</DialogTitle>
          <DialogDescription>
            We found a feedback draft you were working on.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Draft Preview */}
          <div className="space-y-4">
            {/* Ratings - side by side with flex-wrap */}
            <div className="flex flex-wrap gap-6">
              {/* Rating */}
              {rating > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Course Rating
                  </div>
                  <EditableStarRating
                    value={rating}
                    onChange={() => {}}
                    disabled={true}
                    size="md"
                  />
                </div>
              )}

              {/* Workload Rating */}
              {workloadRating > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Workload
                  </div>
                  <EditableWorkloadRating
                    value={workloadRating}
                    onChange={() => {}}
                    disabled={true}
                    size="md"
                  />
                </div>
              )}
            </div>

            {/* Comment - always shown */}
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">
                Your Feedback
              </div>
              <div className="text-sm text-gray-800 max-h-[200px] overflow-y-auto">
                {hasComment ? (
                  <FeedbackMarkdown>{comment}</FeedbackMarkdown>
                ) : (
                  <p className="text-gray-500 italic">No comment saved</p>
                )}
              </div>
            </div>

            {/* Timestamp - secondary information */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="size-3" />
              <span>Last saved {timeAgo}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="flex-1 sm:flex-1"
          >
            Start Fresh
          </Button>
          <Button onClick={onRestore} className="flex-1 sm:flex-1">
            Restore Draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
