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
import { EllipsisVertical, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { getTruncatedText } from '~/lib/textUtils'
import { FeedbackCategoryChips } from './FeedbackCategoryChips'
import { FeedbackMarkdown } from './FeedbackMarkdown'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const characterLimit = 600
  const isLongComment =
    feedback.comment && feedback.comment.length > characterLimit
  const relativeTime = getRelativeTime(new Date(feedback.createdAt))

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteFeedback(feedback.id)
      toast.success('Feedback deleted successfully')
      setIsDeleteDialogOpen(false)
      // Invalidate queries to refresh the feedback list and stats
      await queryClient.invalidateQueries({ queryKey: ['user', 'feedback'] })
      await queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete feedback'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-6 mb-6 hover:shadow-[0px_6px_24px_rgba(0,0,0,0.08)] transition-shadow">
      {/* Header */}
      <div className="mb-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{feedback.courseName}</span>
              {!feedback.approvedAt && (
                <Chip color="red" label="Removed by moderators" />
              )}
            </div>
          </div>
          {/* Action Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="xs">
                <EllipsisVertical className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="flex flex-col gap-1">
                <Link
                  to={`/courses/${feedback.courseId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <ExternalLink className="size-4 mr-2" />
                    Open Course Page
                  </Button>
                </Link>
                <Link to={`/feedback/${feedback.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Pencil className="size-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {/* Rating, Workload, Categories */}
        <div className="flex justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
            <StarRating value={feedback.rating} size="sm" />
            {feedback.workloadRating && (
              <div className="inline-flex items-center text-xs text-gray-500 font-medium">
                <span className="mr-1">Workload:</span>
                <WorkloadRatingDisplay rating={feedback.workloadRating} />
              </div>
            )}
          </div>
          {feedback.points !== null && feedback.points > 0 && (
            <div className="flex-shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-sm font-semibold text-primary hover:underline cursor-pointer">
                    +{feedback.points} pts
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                  {feedback.analysis && (
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
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      {/* Comment */}
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
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
                {isExpanded ? 'Show less' : 'Show more'}
              </Button>
            )}
          </>
        ) : (
          <p className="text-gray-500 italic text-sm pl-4">
            You did not leave any comment
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">{relativeTime}</p>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feedback</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this feedback? Once deleted, this
              feedback will be removed from the platform and will no longer be
              visible to other students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
