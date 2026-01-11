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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  EditableStarRating,
  WorkloadRatingSelect
} from '@uni-feedback/ui'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { useState } from 'react'
import { toast } from 'sonner'

interface EditFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedbackId: number
  initialSchoolYear: number | null
  initialRating: number | null
  initialWorkloadRating: number | null
}

export function EditFeedbackDialog({
  open,
  onOpenChange,
  feedbackId,
  initialSchoolYear,
  initialRating,
  initialWorkloadRating
}: EditFeedbackDialogProps) {
  const queryClient = useQueryClient()
  const [schoolYear, setSchoolYear] = useState<string>(
    initialSchoolYear?.toString() || ''
  )
  const [rating, setRating] = useState<number | null>(initialRating)
  const [workloadRating, setWorkloadRating] = useState<number | null>(
    initialWorkloadRating
  )

  const updateMutation = useMutation({
    mutationFn: (updates: {
      schoolYear?: number | null
      rating?: number | null
      workloadRating?: number | null
    }) => updateFeedback(feedbackId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['feedback-details', feedbackId]
      })
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] })
      onOpenChange(false)
      toast.success('Feedback updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update feedback'
      )
    }
  })

  const handleSave = () => {
    const updates: any = {}

    if (schoolYear !== (initialSchoolYear?.toString() || '')) {
      updates.schoolYear = schoolYear ? parseInt(schoolYear) : null
    }

    if (rating !== initialRating) {
      updates.rating = rating || undefined
    }

    if (workloadRating !== initialWorkloadRating) {
      updates.workloadRating = workloadRating
    }

    updateMutation.mutate(updates)
  }

  const handleCancel = () => {
    setSchoolYear(initialSchoolYear?.toString() || '')
    setRating(initialRating)
    setWorkloadRating(initialWorkloadRating)
    onOpenChange(false)
  }

  // Generate 5 most recent school years
  const currentYear = getCurrentSchoolYear()
  const schoolYearOptions = []
  for (let year = currentYear; year > currentYear - 5; year--) {
    schoolYearOptions.push(year)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Feedback</DialogTitle>
          <DialogDescription>
            Update the school year, rating, and workload rating for this
            feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* School Year */}
          <div className="space-y-2">
            <Label>School Year</Label>
            <Select
              value={schoolYear || 'none'}
              onValueChange={(value) =>
                setSchoolYear(value === 'none' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select school year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {schoolYearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}/{year + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            {rating ? (
              <EditableStarRating
                value={rating}
                onChange={(newValue) => setRating(newValue)}
                labelPosition="right"
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">No rating</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRating(3)}
                  className="text-xs"
                >
                  Add Rating
                </Button>
              </div>
            )}
          </div>

          {/* Workload Rating */}
          <div className="space-y-2">
            <Label>Workload Rating</Label>
            <WorkloadRatingSelect
              value={workloadRating}
              onChange={setWorkloadRating}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
