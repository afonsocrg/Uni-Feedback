import {
  getCourse,
  getFaculties,
  MeicFeedbackAPIError
} from '@uni-feedback/api-client'
import { useState } from 'react'
import { toast } from 'sonner'
import { GiveFeedbackContent } from '~/components'
import { useSubmitFeedback } from '~/hooks/queries'
import { STORAGE_KEYS } from '~/utils/constants'

import type { Route } from './+types/feedback.new'

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

  // Email always comes from localStorage (not URL for privacy)
  const savedEmail = localStorage.getItem(STORAGE_KEYS.FEEDBACK_EMAIL) || ''

  return {
    faculties,
    initialFormValues: {
      email: savedEmail,
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
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (values: {
    email: string
    schoolYear: number
    facultyId: number
    degreeId: number
    courseId: number
    rating: number
    workloadRating: number
    comment?: string
  }) => {
    // Store values in localStorage for next time
    localStorage.setItem(STORAGE_KEYS.FEEDBACK_EMAIL, values.email)
    localStorage.setItem(
      STORAGE_KEYS.FEEDBACK_FACULTY_ID,
      values.facultyId.toString()
    )
    localStorage.setItem(
      STORAGE_KEYS.FEEDBACK_DEGREE_ID,
      values.degreeId.toString()
    )

    try {
      // Submit feedback using TanStack Query mutation
      await submitFeedbackMutation.mutateAsync({
        email: values.email,
        schoolYear: values.schoolYear,
        courseId: values.courseId,
        rating: values.rating,
        workloadRating: values.workloadRating,
        comment: values.comment
      })

      setIsSuccess(true)
      toast.success('Feedback submitted successfully!')
    } catch (error) {
      if (error instanceof MeicFeedbackAPIError) {
        toast.error(error.message)
      } else {
        console.error('Failed to submit feedback:', error)
        toast.error('Failed to submit feedback. Please try again.')
      }
      throw error // Re-throw so the form can handle it
    }
  }

  return (
    <GiveFeedbackContent
      faculties={loaderData.faculties}
      initialFormValues={loaderData.initialFormValues}
      onSubmit={handleSubmit}
      onReset={() => setIsSuccess(false)}
      isSubmitting={submitFeedbackMutation.isPending}
      isSuccess={isSuccess}
    />
  )
}
