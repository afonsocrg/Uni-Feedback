import { getFaculties } from '@uni-feedback/api-client'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { CourseBrowser } from '~/components'
import { useAuth } from '~/hooks'
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

export default function FeedbackBrowserPage({
  loaderData
}: Route.ComponentProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  // Handle backward compatibility with ?courseId param
  useEffect(() => {
    const courseIdParam = searchParams.get('courseId')
    if (courseIdParam) {
      const courseId = Number(courseIdParam)
      if (!isNaN(courseId) && courseId > 0) {
        navigate(`/courses/${courseId}/feedback?from=course_browser`, {
          replace: true
        })
      }
    }
  }, [searchParams, navigate])

  // Track browser page view
  useEffect(() => {
    const fromSource = searchParams.get('from')
    analytics.feedback.browserViewed({
      isAuthenticated,
      hasPreselectedFilters: !!(
        storage.getSelectedFacultyId() || storage.getSelectedDegreeId()
      ),
      fromSource: fromSource || undefined
    })
  }, [isAuthenticated, searchParams])

  const handleCourseSelect = (courseId: number) => {
    // Track analytics
    analytics.feedback.courseSelectedFromBrowser({ courseId })

    // Navigate to course-specific feedback page with entry point
    navigate(`/courses/${courseId}/feedback?from=course_browser`)
  }

  return (
    <main className="min-h-screen">
      <CourseBrowser
        faculties={loaderData.faculties}
        onCourseSelect={handleCourseSelect}
      />
    </main>
  )
}
