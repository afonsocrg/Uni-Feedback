import { getFaculties } from '@uni-feedback/api-client'
import { useMemo } from 'react'
import { redirect, useNavigate } from 'react-router'
import { z } from 'zod'
import { CourseBrowser } from '~/components'
import { useAuth } from '~/hooks'
import { analytics } from '~/utils/analytics'

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
    { title: 'Find Your Course - Uni Feedback' },
    {
      name: 'description',
      content: 'Search and select a course to leave feedback'
    }
  ]
}

// Use clientLoader for client-side data fetching
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const faculties = await getFaculties()

  // Check for backward compatibility with ?courseId param
  const url = new URL(request.url)
  const courseIdParam = url.searchParams.get('courseId')

  if (courseIdParam) {
    const courseId = Number(courseIdParam)
    if (!isNaN(courseId) && courseId > 0) {
      throw redirect(`/courses/${courseId}/feedback`)
    }
  }

  return { faculties }
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

export default function FeedbackBrowserPage({
  loaderData
}: Route.ComponentProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Smart default: detect user's university from email
  const initialFacultyId = useMemo(() => {
    if (!user?.email) return undefined
    const domain = user.email.split('@')[1]?.toLowerCase()
    return loaderData.faculties.find((f) =>
      f.emailSuffixes?.some((s) => s.toLowerCase() === domain)
    )?.id
  }, [user, loaderData.faculties])

  const handleCourseSelect = (courseId: number) => {
    // Track analytics
    analytics.feedback.courseSelectedFromBrowser({ courseId })

    // Navigate to course-specific feedback page
    navigate(`/courses/${courseId}/feedback`)
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Which course do you want to review?
        </h1>
        <p className="text-gray-600 mb-6">
          Search or browse to find your course
        </p>

        <CourseBrowser
          faculties={loaderData.faculties}
          initialFacultyId={initialFacultyId}
          onCourseSelect={handleCourseSelect}
        />
      </div>
    </main>
  )
}
