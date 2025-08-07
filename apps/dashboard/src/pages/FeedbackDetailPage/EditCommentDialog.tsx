import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateFeedback } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  MarkdownTextarea
} from '@uni-feedback/ui'
import { useState } from 'react'
import { toast } from 'sonner'

interface EditCommentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedbackId: number
  initialComment: string | null
}

export function EditCommentDialog({
  open,
  onOpenChange,
  feedbackId,
  initialComment
}: EditCommentDialogProps) {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState(initialComment || '')

  const updateMutation = useMutation({
    mutationFn: (updates: { comment: string | null }) =>
      updateFeedback(feedbackId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['feedback-details', feedbackId]
      })
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] })
      onOpenChange(false)
      toast.success('Feedback comment updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update feedback comment'
      )
    }
  })

  const handleSave = () => {
    const trimmedComment = comment.trim()
    updateMutation.mutate({
      comment: trimmedComment || null
    })
  }

  const handleCancel = () => {
    setComment(initialComment || '')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Student Comment</DialogTitle>
          <DialogDescription>
            Update the comment for this feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <MarkdownTextarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter student comment using Markdown..."
            className="min-h-40"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Comment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
