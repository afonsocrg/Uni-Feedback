import {
  ConfirmationDialog,
  EditableSelect,
  EditableStarRatingField,
  EditableWorkloadRating
} from '@components'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminFeedbackDetail, updateFeedback } from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip
} from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Check, Edit3, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EditFeedbackDialog } from './EditFeedbackDialog'

interface FeedbackInfoCardProps {
  feedback: AdminFeedbackDetail
}

export function FeedbackInfoCard({ feedback }: FeedbackInfoCardProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)

  const feedbackId = id ? parseInt(id, 10) : 0

  const updateMutation = useMutation({
    mutationFn: (updates: any) => updateFeedback(feedbackId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['feedback-details', feedbackId]
      })
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] })
      setEditValues({})
      toast.success('Feedback updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update feedback'
      )
    }
  })

  const handleApprove = async () => {
    await updateMutation.mutateAsync({ approved: true })
  }

  const handleDisapprove = async () => {
    await updateMutation.mutateAsync({ approved: false })
  }

  // Generate 5 most recent school years
  const currentYear = getCurrentSchoolYear()
  const schoolYearOptions = []
  for (let year = currentYear; year > currentYear - 5; year--) {
    schoolYearOptions.push(year)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Feedback Information
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRatingDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Faculty, Degree, Course navigation */}
            <div className="space-y-2">
              <dt className="font-medium text-sm">Faculty › Degree › Course</dt>
              <dd className="flex gap-2 flex-wrap">
                <Chip
                  label={feedback.facultyShortName}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/faculties/${feedback.facultyId}`)}
                />
                <Chip
                  label={feedback.degreeAcronym}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/degrees/${feedback.degreeId}`)}
                />
                <Chip
                  label={feedback.courseAcronym}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/courses/${feedback.courseId}`)}
                />
              </dd>
            </div>

            {/* Email (non-editable) */}
            <div className="space-y-2">
              <dt className="font-medium text-sm">Email</dt>
              <dd className="text-sm">
                {feedback.email ? (
                  <Badge variant="outline">{feedback.email}</Badge>
                ) : (
                  <span className="text-muted-foreground">Anonymous</span>
                )}
              </dd>
            </div>

            {/* School Year (editable) */}
            <EditableSelect
              label="School Year"
              value={feedback.schoolYear?.toString() || null}
              options={schoolYearOptions.map((year) => ({
                value: year.toString(),
                label: formatSchoolYearString(year, { yearFormat: 'long' })
              }))}
              onSave={(newValue) => {
                updateMutation.mutate({ schoolYear: parseInt(newValue, 10) })
              }}
              disabled={updateMutation.isPending}
            />

            {/* Rating (editable) */}
            <EditableStarRatingField
              label="Rating"
              value={feedback.rating}
              onSave={(value) => {
                updateMutation.mutate({ rating: value })
              }}
              disabled={updateMutation.isPending}
              labelPosition="bottom"
            />

            {/* Workload Rating (editable) */}
            <EditableWorkloadRating
              label="Workload Rating"
              value={feedback.workloadRating}
              editValue={
                editValues['workloadRating'] || feedback.workloadRating
              }
              onSave={(value) => {
                updateMutation.mutate({ workloadRating: value })
              }}
              disabled={updateMutation.isPending}
            />

            {/* Approval Status (editable) */}
            <div className="space-y-2">
              <dt className="font-medium text-sm">Approval Status</dt>
              <dd className="flex items-center gap-2">
                <Badge variant={feedback.approved ? 'default' : 'secondary'}>
                  {feedback.approved ? 'Approved' : 'Pending Approval'}
                </Badge>
                {feedback.approvedAt && (
                  <span className="text-muted-foreground text-xs">
                    on {new Date(feedback.approvedAt).toLocaleDateString()}
                  </span>
                )}
                
                {feedback.approved ? (
                  <ConfirmationDialog
                    onConfirm={handleDisapprove}
                    message="Are you sure you want to unapprove this feedback? This will hide it from students."
                    title="Unapprove Feedback"
                    confirmText="Unapprove"
                    variant="destructive"
                  >
                    {({ open }) => (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={open}
                        disabled={updateMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Unapprove
                      </Button>
                    )}
                  </ConfirmationDialog>
                ) : (
                  <ConfirmationDialog
                    onConfirm={handleApprove}
                    message="Are you sure you want to approve this feedback? This will make it visible to students."
                    title="Approve Feedback"
                    confirmText="Approve"
                    variant="default"
                  >
                    {({ open }) => (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={open}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                  </ConfirmationDialog>
                )}
              </dd>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditFeedbackDialog
        open={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        feedbackId={feedbackId}
        initialSchoolYear={feedback.schoolYear}
        initialRating={feedback.rating}
        initialWorkloadRating={feedback.workloadRating}
      />
    </>
  )
}
