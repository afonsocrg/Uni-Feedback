import { ConfirmationDialog, UnapprovalMessageDialog } from '@components'
import { useMutation } from '@tanstack/react-query'
import {
  approveFeedback,
  unapproveFeedback,
  updateFeedbackAnalysis,
  type AdminFeedback
} from '@uni-feedback/api-client'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label
} from '@uni-feedback/ui'
import { Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface AnalysisEditDialogProps {
  feedback: AdminFeedback
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AnalysisEditDialog({
  feedback,
  open,
  onOpenChange,
  onSuccess
}: AnalysisEditDialogProps) {
  // Initialize state with existing analysis or defaults
  const [hasTeaching, setHasTeaching] = useState(
    feedback.analysis?.hasTeaching ?? false
  )
  const [hasAssessment, setHasAssessment] = useState(
    feedback.analysis?.hasAssessment ?? false
  )
  const [hasMaterials, setHasMaterials] = useState(
    feedback.analysis?.hasMaterials ?? false
  )
  const [hasTips, setHasTips] = useState(feedback.analysis?.hasTips ?? false)
  const [unapprovalDialogOpen, setUnapprovalDialogOpen] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () =>
      updateFeedbackAnalysis(feedback.id, {
        hasTeaching,
        hasAssessment,
        hasMaterials,
        hasTips
      }),
    onSuccess: (data: { pointsAwarded: number | null }) => {
      toast.success(
        `Analysis ${feedback.analysis ? 'updated' : 'created'} successfully! ${data.pointsAwarded !== null ? `Points: ${data.pointsAwarded}` : 'No points awarded (feedback not approved or user missing)'}`
      )
      onSuccess()
    },
    onError: (error) => {
      toast.error(
        `Failed to ${feedback.analysis ? 'update' : 'create'} analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })

  const approveMutation = useMutation({
    mutationFn: () => approveFeedback(feedback.id),
    onSuccess: () => {
      toast.success('Feedback approved successfully')
      onSuccess()
    },
    onError: () => {
      toast.error('Failed to approve feedback')
    }
  })

  const unapproveMutation = useMutation({
    mutationFn: (message: string) => unapproveFeedback(feedback.id, message),
    onSuccess: () => {
      toast.success('Feedback unapproved and email sent successfully')
      onSuccess()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to unapprove feedback'
      )
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {feedback.analysis ? 'Edit' : 'Create'} Feedback Analysis
            </DialogTitle>
            <DialogDescription>
              Feedback ID: #{feedback.id}
              <br />
              {feedback.courseName} ({feedback.courseAcronym})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Feedback Comment */}
            <div>
              <Label className="mb-2 block font-medium">Feedback Comment</Label>
              <textarea
                disabled
                className="w-full whitespace-pre-wrap rounded-md border border-input bg-muted p-4 text-sm overflow-y-auto"
              >
                {feedback.comment || 'N/A'}
              </textarea>
            </div>

            {/* Teaching */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hasTeaching" className="cursor-pointer">
                <div>
                  <div className="font-medium">Teaching Quality</div>
                  <div className="text-sm text-muted-foreground">
                    Mentions teaching quality or professor feedback
                  </div>
                </div>
              </Label>
              <Checkbox
                id="hasTeaching"
                checked={hasTeaching}
                onCheckedChange={(e) => setHasTeaching(e as boolean)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            {/* Assessment */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hasAssessment" className="cursor-pointer">
                <div>
                  <div className="font-medium">Assessment</div>
                  <div className="text-sm text-muted-foreground">
                    Mentions exams, projects, or grading
                  </div>
                </div>
              </Label>
              <Checkbox
                id="hasAssessment"
                checked={hasAssessment}
                onCheckedChange={(e) => setHasAssessment(e as boolean)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            {/* Materials */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hasMaterials" className="cursor-pointer">
                <div>
                  <div className="font-medium">Course Materials</div>
                  <div className="text-sm text-muted-foreground">
                    Mentions textbooks, slides, or resources
                  </div>
                </div>
              </Label>
              <Checkbox
                id="hasMaterials"
                checked={hasMaterials}
                onCheckedChange={(e) => setHasMaterials(e as boolean)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            {/* Tips */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hasTips" className="cursor-pointer">
                <div>
                  <div className="font-medium">Study Tips</div>
                  <div className="text-sm text-muted-foreground">
                    Provides tips or recommendations
                  </div>
                </div>
              </Label>
              <Checkbox
                id="hasTips"
                checked={hasTips}
                onCheckedChange={(e) => setHasTips(e as boolean)}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              {feedback.approved ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setUnapprovalDialogOpen(true)}
                    disabled={unapproveMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Unapprove
                  </Button>
                  <UnapprovalMessageDialog
                    open={unapprovalDialogOpen}
                    onCancel={() => setUnapprovalDialogOpen(false)}
                    courseName={feedback.courseName || feedback.courseAcronym}
                    feedback={feedback}
                    onConfirm={(message: string) =>
                      unapproveMutation.mutate(message)
                    }
                  />
                </>
              ) : (
                <ConfirmationDialog
                  title="Approve Feedback"
                  message="Are you sure you want to approve this feedback?"
                  confirmText="Approve"
                  onConfirm={() => approveMutation.mutate()}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="default"
                      onClick={open}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  )}
                </ConfirmationDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending
                  ? 'Saving...'
                  : feedback.analysis
                    ? 'Update Analysis'
                    : 'Create Analysis'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
