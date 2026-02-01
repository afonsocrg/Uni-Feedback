import { useQueryClient } from '@tanstack/react-query'
import { editFeedback, MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  EditFeedbackContent,
  EditFeedbackSuccess,
  GenericBreadcrumb,
  PermissionError,
  type BreadcrumbItemData,
  type EditFeedbackFormData
} from '~/components'
import { useFeedbackForEdit } from '~/hooks/queries'

export default function EditFeedbackPage() {
  const navigate = useNavigate()
  const params = useParams()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [points, setPoints] = useState(0)

  // Parse feedbackId from params
  const feedbackId = params.id ? parseInt(params.id) : null

  // Fetch feedback for editing
  const { data, isLoading, error } = useFeedbackForEdit(feedbackId)

  const breadcrumbItems: BreadcrumbItemData[] = [
    { label: 'Profile', href: '/profile' },
    { label: 'Edit Feedback', isActive: true }
  ]

  // Loading state
  if (isLoading) {
    return (
      <>
        <div className="container mx-auto px-4 py-6">
          <GenericBreadcrumb items={breadcrumbItems} />
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading feedback...</p>
        </div>
      </>
    )
  }

  // Error state
  if (error || !data) {
    const errorMessage =
      error instanceof MeicFeedbackAPIError
        ? error.message
        : "We couldn't find that feedback or you don't have permission to edit it."

    return (
      <>
        <div className="container mx-auto px-4 py-6">
          <GenericBreadcrumb items={breadcrumbItems} />
        </div>
        <PermissionError
          message={errorMessage}
          onBackToProfile={() => navigate('/profile')}
        />
      </>
    )
  }

  const { feedback } = data

  const handleSubmit = async (values: EditFeedbackFormData) => {
    setIsSubmitting(true)

    try {
      const response = await editFeedback(feedback.id, {
        rating: values.rating,
        workloadRating: values.workloadRating,
        comment: values.comment
      })

      setPoints(response.points)
      setIsSuccess(true)
      toast.success('Feedback updated successfully!')

      // Invalidate queries to refetch updated data
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['feedback', feedbackId, 'edit']
        }),
        queryClient.invalidateQueries({ queryKey: ['user', 'feedback'] }),
        queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
      ])
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to update feedback. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <>
        <div className="container mx-auto px-4 py-6">
          <GenericBreadcrumb items={breadcrumbItems} />
        </div>
        <EditFeedbackSuccess
          points={points}
          courseId={feedback.courseId}
          feedbackId={feedback.id}
          onBackToProfile={() => navigate('/profile')}
        />
      </>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <GenericBreadcrumb items={breadcrumbItems} />
      </div>
      <EditFeedbackContent
        feedback={feedback}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/profile')}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
