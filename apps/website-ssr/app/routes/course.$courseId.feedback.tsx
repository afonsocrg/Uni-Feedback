import { zodResolver } from '@hookform/resolvers/zod'
import {
  editFeedback,
  MeicFeedbackAPIError,
  type DuplicateFeedbackDetail
} from '@uni-feedback/api-client'
import { database } from '@uni-feedback/db'
import { courses } from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { eq } from 'drizzle-orm'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  CourseSpecificFeedbackForm,
  DuplicateFeedbackResolution,
  SubmitFeedbackSuccess,
  UpdateFeedbackSuccess
} from '~/components'
import { useAuth, useLastVisitedPath } from '~/hooks'
import { useSubmitFeedback } from '~/hooks/queries'
import { analytics, getPageName } from '~/utils/analytics'

import type { Route } from './+types/course.$courseId.feedback'

// Form schema for feedback submission (reuse from feedback.new.tsx)
const feedbackSchema = z.object({
  schoolYear: z.number().min(2000, 'Invalid school year'),
  courseId: z.number().min(1, 'Course is required'),
  rating: z.number().min(1, 'Rating is required').max(5),
  workloadRating: z.number().min(1, 'Workload rating is required').max(5),
  comment: z.string().optional()
})

export type FeedbackFormData = z.infer<typeof feedbackSchema>

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData.course) {
    return [
      { title: 'Course Not Found - Uni Feedback' },
      { name: 'description', content: 'The requested course was not found.' }
    ]
  }

  const { course } = loaderData
  const title = `Give Feedback for ${course.name} - Uni Feedback`
  const description = `Share your experience with ${course.name} (${course.acronym}) at ${course.degree.faculty.shortName}. Your anonymous feedback helps fellow students make informed decisions.`

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' }
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
  const courseId = parseInt(params.courseId, 10)
  if (isNaN(courseId)) {
    throw new Response('Invalid course ID', { status: 400 })
  }

  const db = database()

  // Fetch course with degree and faculty
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      degree: {
        with: {
          faculty: true
        }
      }
    }
  })

  if (!course || !course.degree || !course.degree.faculty) {
    throw new Response('Course not found', { status: 404 })
  }

  return { course }
}

export default function CourseSpecificFeedbackPage({
  loaderData
}: Route.ComponentProps) {
  const { course } = loaderData
  const submitFeedbackMutation = useSubmitFeedback()
  const { isAuthenticated } = useAuth()
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)
  const [isEditSuccess, setIsEditSuccess] = useState(false)
  const [pointsEarned, setPointsEarned] = useState<number | undefined>(
    undefined
  )
  const [submittedCourseId, setSubmittedCourseId] = useState<
    number | undefined
  >(undefined)
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState<
    number | undefined
  >(undefined)
  const [duplicateFeedback, setDuplicateFeedback] =
    useState<DuplicateFeedbackDetail | null>(null)
  const [formLoadTime] = useState<number>(() => Date.now())

  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'

  // Create form with course pre-selected
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    mode: 'onChange',
    defaultValues: {
      schoolYear: getCurrentSchoolYear(),
      courseId: course.id,
      rating: 0,
      workloadRating: 0,
      comment: ''
    }
  })

  // Track feedback form view
  useEffect(() => {
    analytics.feedback.formViewed({
      isAuthenticated
    })
  }, [isAuthenticated])

  const submitFeedback = async (values: FeedbackFormData) => {
    try {
      const response = await submitFeedbackMutation.mutateAsync({
        schoolYear: values.schoolYear,
        courseId: values.courseId,
        rating: values.rating,
        workloadRating: values.workloadRating,
        comment: values.comment
      })

      analytics.feedback.submitted({
        courseId: values.courseId,
        hasComment: !!values.comment,
        commentLength: values.comment?.length
      })

      setPointsEarned(response.pointsEarned)
      setSubmittedCourseId(values.courseId)
      setSubmittedFeedbackId(response.feedbackId)
      setIsSubmitSuccess(true)
      toast.success('Feedback submitted successfully!')
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        if (error.status === 409 && error.data.feedback) {
          setDuplicateFeedback(error.data.feedback)
          toast.info(
            `You've already submitted feedback for ${error.data.feedback.course.name}`,
            {
              description: 'You can update your existing feedback below.'
            }
          )
          analytics.feedback.duplicateShown({
            courseId: values.courseId,
            existingFeedbackId: error.data.feedback.id
          })
          return
        }

        analytics.feedback.failed({
          courseId: values.courseId,
          errorType: error.status === 400 ? 'validation' : 'api_error',
          errorMessage: error.message
        })

        toast.error(error.message)
      } else {
        analytics.feedback.failed({
          courseId: values.courseId,
          errorType: 'network',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })

        console.error('Failed to submit feedback:', error)
        toast.error('Failed to submit feedback. Please try again.')
      }
      throw error
    }
  }

  const handleSubmit = async (values: FeedbackFormData) => {
    const formCompletionTime = Math.round((Date.now() - formLoadTime) / 1000)
    analytics.feedback.submitClicked({
      courseId: values.courseId,
      formCompletionTime,
      isAuthenticated
    })

    submitFeedback(values)
  }

  const handleEdit = async (values: {
    rating: number
    workloadRating: number
    comment?: string
  }) => {
    if (!duplicateFeedback) {
      console.error('No duplicate feedback to edit')
      return
    }
    try {
      const response = await editFeedback(duplicateFeedback.id, {
        rating: values.rating,
        workloadRating: values.workloadRating,
        comment: values.comment
      })

      const createdAt = new Date(duplicateFeedback.createdAt)
      const daysSinceOriginal = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      analytics.feedback.existingUpdated({
        feedbackId: duplicateFeedback.id,
        daysSinceOriginal,
        ratingChanged: values.rating !== duplicateFeedback.rating,
        commentChanged: values.comment !== duplicateFeedback.comment
      })

      toast.success('Feedback updated successfully!')
      setSubmittedCourseId(duplicateFeedback.courseId)
      setSubmittedFeedbackId(duplicateFeedback.id)
      setDuplicateFeedback(null)
      setPointsEarned(response.points)
      setIsEditSuccess(true)
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        toast.error(error.message)
      } else {
        toast.error('Failed to update feedback. Please try again.')
      }
    }
  }

  const handleSubmitAnother = () => {
    analytics.navigation.feedbackFormLinkClicked({
      source: 'success_modal',
      referrerPage: getPageName(window.location.pathname)
    })

    setIsSubmitSuccess(false)
    setIsEditSuccess(false)
    setPointsEarned(undefined)
    setSubmittedCourseId(undefined)
    setSubmittedFeedbackId(undefined)
    setDuplicateFeedback(null)

    // Redirect to feedback browser to select another course
    window.location.href = '/feedback/new'
  }

  // Show submit success screen
  if (isSubmitSuccess) {
    return (
      <SubmitFeedbackSuccess
        pointsEarned={pointsEarned}
        courseId={submittedCourseId}
        feedbackId={submittedFeedbackId}
        onSubmitAnother={handleSubmitAnother}
        browseLink={browseLink}
      />
    )
  }

  // Show edit success screen
  if (isEditSuccess) {
    return (
      <UpdateFeedbackSuccess
        points={pointsEarned}
        courseId={submittedCourseId}
        feedbackId={submittedFeedbackId}
        onSubmitAnother={handleSubmitAnother}
      />
    )
  }

  // Show duplicate feedback resolution screen
  if (duplicateFeedback) {
    return (
      <DuplicateFeedbackResolution
        existingFeedback={duplicateFeedback}
        form={form}
        onSubmit={handleEdit}
        onCancel={() => {
          setDuplicateFeedback(null)
        }}
        isSubmitting={submitFeedbackMutation.isPending}
      />
    )
  }

  return (
    <CourseSpecificFeedbackForm
      course={course}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={submitFeedbackMutation.isPending}
    />
  )
}
