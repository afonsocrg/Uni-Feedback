import { getFaculties } from '@uni-feedback/api-client'
import { redirect, useNavigate } from 'react-router'
import { z } from 'zod'
import { CourseBrowser } from '~/components'
import { analytics } from '~/utils/analytics'
import { storage } from '~/utils/storage'

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

// Server loader: fetch faculties (SSR)
export async function loader() {
  const faculties = await getFaculties()
  return { faculties }
}

// Client loader: add localStorage data during hydration
export async function clientLoader({
  request,
  serverLoader
}: Route.ClientLoaderArgs) {
  // Check for backward compatibility with ?courseId param
  const url = new URL(request.url)
  const courseIdParam = url.searchParams.get('courseId')

  if (courseIdParam) {
    const courseId = Number(courseIdParam)
    if (!isNaN(courseId) && courseId > 0) {
      throw redirect(`/courses/${courseId}/feedback`)
    }
  }

  // Get server data
  const serverData = await serverLoader()

  // Restore course browser selections using storage wrapper
  const initialFacultyId = storage.getSelectedFacultyId()
  const initialDegreeId = storage.getSelectedDegreeId()

  return {
    ...serverData,
    initialFacultyId,
    initialDegreeId
  }
}

// Force clientLoader to run during hydration (not just client-side navigations)
clientLoader.hydrate = true

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

  const handleCourseSelect = (courseId: number) => {
    // Track analytics
    analytics.feedback.courseSelectedFromBrowser({ courseId })

    // Navigate to course-specific feedback page
    navigate(`/courses/${courseId}/feedback`)
  }

  return (
    <main className="min-h-screen">
      <CourseBrowser
        faculties={loaderData.faculties}
        initialFacultyId={loaderData.initialFacultyId}
        initialDegreeId={loaderData.initialDegreeId}
        onCourseSelect={handleCourseSelect}
      />
    </main>
  )
}
