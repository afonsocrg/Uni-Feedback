import { zodResolver } from '@hookform/resolvers/zod'
import {
  editFeedback,
  getCourse,
  getFaculties,
  MeicFeedbackAPIError,
  type DuplicateFeedbackDetail
} from '@uni-feedback/api-client'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  DuplicateFeedbackResolution,
  GiveFeedbackContent,
  SubmitFeedbackSuccess,
  UpdateFeedbackSuccess
} from '~/components'
import { useAuth, useLastVisitedPath } from '~/hooks'
import { useSubmitFeedback } from '~/hooks/queries'
import { analytics } from '~/utils/analytics'
import { STORAGE_KEYS } from '~/utils/constants'

import type { Route } from './+types/feedback.new'

// Form schema for feedback submission
const feedbackSchema = z.object({
  schoolYear: z.number().min(2000, 'Invalid school year'),
  facultyId: z.number().min(1, 'Faculty is required'),
  degreeId: z.number().min(1, 'Degree is required'),
  courseId: z.number().min(1, 'Course is required'),
  rating: z.number().min(1, 'Rating is required').max(5),
  workloadRating: z.number().min(1, 'Workload rating is required').max(5),
  comment: z.string().optional()
})

export type FeedbackFormData = z.infer<typeof feedbackSchema>

export function meta() {
  return [
    { title: 'Give Feedback - Uni Feedback' },
    {
      name: 'description',
      content:
        'Share your honest course review to help fellow students make informed decisions.'
    }
  ]
}

// Use clientLoader for client-side data fetching to avoid SSR overhead on a form page
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const faculties = await getFaculties()

  // Check for courseId in URL search params
  const url = new URL(request.url)
  const courseIdParam = url.searchParams.get('courseId')

  let facultyId = 0
  let degreeId = 0
  let courseId = 0

  // If courseId is in URL, fetch the course and use its faculty/degree
  if (courseIdParam) {
    const parsedCourseId = Number(courseIdParam)
    if (!isNaN(parsedCourseId) && parsedCourseId > 0) {
      try {
        const courseData = await getCourse(parsedCourseId)
        courseId = courseData.id
        degreeId = courseData.degreeId
        if (courseData.degree) {
          facultyId = courseData.degree.facultyId
        }
      } catch (error) {
        console.error('Failed to load course from URL:', error)
        // Fall through to use localStorage values
      }
    }
  }

  // If no valid course from URL, use localStorage values
  if (!courseId) {
    facultyId =
      Number(localStorage.getItem(STORAGE_KEYS.FEEDBACK_FACULTY_ID)) || 0
    degreeId =
      Number(localStorage.getItem(STORAGE_KEYS.FEEDBACK_DEGREE_ID)) || 0
  }

  return {
    faculties,
    initialFormValues: {
      facultyId,
      degreeId,
      courseId
    }
  }
}

export function HydrateFallback() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-200 border-t-primaryBlue rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    </main>
  )
}

export default function GiveFeedbackPage({ loaderData }: Route.ComponentProps) {
  const submitFeedbackMutation = useSubmitFeedback()
  const { isAuthenticated } = useAuth()
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false)
  const [isEditSuccess, setIsEditSuccess] = useState(false)
  const [pointsEarned, setPointsEarned] = useState<number | undefined>(
    undefined
  )
  const [duplicateFeedback, setDuplicateFeedback] =
    useState<DuplicateFeedbackDetail | null>(null)
  const [formLoadTime] = useState<number>(() => Date.now())

  const lastVisitedPath = useLastVisitedPath()
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'

  // Create form at parent level - single source of truth
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    mode: 'onChange',
    defaultValues: {
      schoolYear: getCurrentSchoolYear(),
      facultyId: loaderData.initialFormValues.facultyId || 0,
      degreeId: loaderData.initialFormValues.degreeId || 0,
      courseId: loaderData.initialFormValues.courseId || 0,
      rating: 0,
      workloadRating: 0,
      comment: ''
    }
  })

  // Track feedback form view
  useEffect(() => {
    const courseId = loaderData.initialFormValues.courseId
    // Determine source: if courseId is pre-filled from URL, source is likely a course page
    // Otherwise, it's a direct navigation to the feedback form
    const source = courseId ? 'course_page' : 'direct_url'

    analytics.feedback.formViewed({
      courseId,
      source,
      isAuthenticated
    })
  }, [loaderData.initialFormValues.courseId, isAuthenticated])

  const submitFeedback = async (values: FeedbackFormData) => {
    try {
      // Submit feedback using TanStack Query mutation
      const response = await submitFeedbackMutation.mutateAsync({
        schoolYear: values.schoolYear,
        courseId: values.courseId,
        rating: values.rating,
        workloadRating: values.workloadRating,
        comment: values.comment
      })

      // Track successful submission
      analytics.feedback.submitted({
        courseId: values.courseId,
        hasComment: !!values.comment,
        commentLength: values.comment?.length
      })

      setPointsEarned(response.pointsEarned)
      setIsSubmitSuccess(true)
      toast.success('Feedback submitted successfully!')
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        // Check if this is a duplicate feedback error (409 Conflict)
        if (error.status === 409 && error.data.feedback) {
          setDuplicateFeedback(error.data.feedback)
          // Track duplicate feedback shown event
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

        // Track submission failure
        analytics.feedback.failed({
          courseId: values.courseId,
          errorType: error.status === 400 ? 'validation' : 'api_error',
          errorMessage: error.message
        })

        toast.error(error.message)
      } else {
        // Track generic failure
        analytics.feedback.failed({
          courseId: values.courseId,
          errorType: 'network',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })

        console.error('Failed to submit feedback:', error)
        toast.error('Failed to submit feedback. Please try again.')
      }
      throw error // Re-throw so the form can handle it
    }
  }

  const handleSubmit = async (values: FeedbackFormData) => {
    // Track submit click (before auth check)
    const formCompletionTime = Math.round((Date.now() - formLoadTime) / 1000)
    analytics.feedback.submitClicked({
      courseId: values.courseId,
      formCompletionTime,
      isAuthenticated
    })

    // Store values in localStorage for next time
    localStorage.setItem(
      STORAGE_KEYS.FEEDBACK_FACULTY_ID,
      values.facultyId.toString()
    )
    localStorage.setItem(
      STORAGE_KEYS.FEEDBACK_DEGREE_ID,
      values.degreeId.toString()
    )

    // AuthenticatedButton ensures user is authenticated before this is called
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

      // Track existing feedback update
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
    setIsSubmitSuccess(false)
    setIsEditSuccess(false)
    setPointsEarned(undefined)
    setDuplicateFeedback(null)

    // Reset form ratings and comment, but preserve faculty/degree selections
    form.setValue('rating', 0)
    form.setValue('workloadRating', 0)
    form.setValue('comment', '')
    form.setValue('courseId', 0)
  }

  // Show submit success screen if feedback was submitted
  if (isSubmitSuccess) {
    return (
      <SubmitFeedbackSuccess
        pointsEarned={pointsEarned}
        onSubmitAnother={handleSubmitAnother}
        browseLink={browseLink}
      />
    )
  }

  // Show edit success screen if feedback was updated
  if (isEditSuccess) {
    return (
      <UpdateFeedbackSuccess
        points={pointsEarned}
        onSubmitAnother={handleSubmitAnother}
      />
    )
  }

  // Show duplicate feedback resolution screen if detected
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
    <GiveFeedbackContent
      faculties={loaderData.faculties}
      form={form}
      onSubmit={handleSubmit}
      isSubmitting={submitFeedbackMutation.isPending}
    />
  )
}
