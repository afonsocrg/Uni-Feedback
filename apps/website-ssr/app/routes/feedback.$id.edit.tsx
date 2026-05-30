import { useQueryClient } from '@tanstack/react-query'
import { editFeedback, MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  EditFeedbackSuccess,
  GenericBreadcrumb,
  PermissionError,
  type BreadcrumbItemData
} from '~/components'
import {
  EditFeedbackContent,
  type EditFeedbackFormData
} from '~/components/feedback/EditFeedbackContent'
import { useLang } from '~/hooks'
import { useFeedbackForEdit } from '~/hooks/queries'
import { getLocalePath } from '~/utils/i18n-routes'

export default function EditFeedbackPage() {
  const { t } = useTranslation('feedback')
  const lang = useLang()
  const profilePath = getLocalePath('profile', lang)
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [points, setPoints] = useState(0)
  const redirectToastShown = useRef(false)

  useEffect(() => {
    if (searchParams.get('redirected') && !redirectToastShown.current) {
      redirectToastShown.current = true
      toast.info(t('edit.already_submitted'), {
        description: t('edit.can_update')
      })
    }
  }, [searchParams, t])

  // Parse feedbackId from params
  const feedbackId = params.id ? parseInt(params.id) : null

  // Fetch feedback for editing
  const { data, isLoading, error } = useFeedbackForEdit(feedbackId)

  const breadcrumbItems: BreadcrumbItemData[] = [
    { label: t('edit.breadcrumb_profile'), href: profilePath },
    { label: t('edit.page_title'), isActive: true }
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
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 z-10 container mx-auto px-4 py-6">
          <GenericBreadcrumb items={breadcrumbItems} />
        </div>
        <PermissionError
          message={errorMessage}
          onBackToProfile={() => navigate(profilePath)}
        />
      </div>
    )
  }

  const { feedback } = data

  const handleSubmit = async (values: EditFeedbackFormData) => {
    setIsSubmitting(true)

    try {
      const response = await editFeedback(feedback.id, {
        rating: values.rating,
        workloadRating: values.workloadRating,
        comment: values.comment,
        schoolYear: values.schoolYear
      })

      setPoints(response.points)
      setIsSuccess(true)
      toast.success(t('edit.toast_updated'))

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
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 z-10 container mx-auto px-4 py-6">
          <GenericBreadcrumb items={breadcrumbItems} />
        </div>
        <EditFeedbackSuccess
          points={points}
          courseId={feedback.courseId}
          feedbackId={feedback.id}
          onBackToProfile={() => navigate(profilePath)}
        />
      </div>
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
        onCancel={() => navigate(profilePath)}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
