import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeCourseTerm } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'
import { toast } from 'sonner'

interface RemoveTermConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: number
  termToRemove: string
}

export function RemoveTermConfirmationDialog({
  open,
  onOpenChange,
  courseId,
  termToRemove
}: RemoveTermConfirmationDialogProps) {
  const queryClient = useQueryClient()

  const removeTermMutation = useMutation({
    mutationFn: (term: string) => removeCourseTerm(courseId, term),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['course-details', courseId]
      })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      onOpenChange(false)
      toast.success('Term removed successfully')
    },
    onError: (error) => {
      onOpenChange(false)
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove term'
      )
    }
  })

  const handleConfirmRemove = () => {
    if (termToRemove) {
      removeTermMutation.mutate(termToRemove)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Term</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove "{termToRemove}" from this
            course's terms? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmRemove}
            disabled={removeTermMutation.isPending}
          >
            {removeTermMutation.isPending ? 'Removing...' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}