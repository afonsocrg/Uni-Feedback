import { editFeedback, MeicFeedbackAPIError } from '@uni-feedback/api-client'
import { database } from '@uni-feedback/db'
import {
  courses,
  degrees,
  faculties,
  feedback,
  sessions
} from '@uni-feedback/db/schema'
import { and, eq, gt } from 'drizzle-orm'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import {
  EditFeedbackContent,
  EditFeedbackSuccess,
  GenericBreadcrumb,
  PermissionError,
  type BreadcrumbItemData,
  type EditFeedbackFormData
} from '~/components'
import type { Route } from './+types/feedback.$id.edit'

// Hash token using SHA-256 (same as API)
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)

  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function meta({ data }: Route.MetaArgs) {
  if (!data || 'error' in data) {
    return [{ title: 'Error - Uni Feedback' }]
  }

  return [
    {
      title: `Edit Feedback - ${data.feedback.courseName} - Uni Feedback`
    }
  ]
}

const unauthorizedError = {
  error: 'unauthorized',
  message: 'You need to be logged in to edit feedback.'
}

const forbiddenError = {
  error: 'forbidden',
  message: 'Nice try! You can only edit your own feedback.'
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const feedbackId = parseInt(params.id)

  if (isNaN(feedbackId)) {
    return forbiddenError
  }

  try {
    // Get access token from cookie
    const cookies = request.headers.get('Cookie') || ''
    const accessTokenMatch = cookies.match(/uni-feedback-auth-access=([^;]+)/)
    const accessToken = accessTokenMatch?.[1]

    if (!accessToken) {
      return unauthorizedError
    }

    const db = database()

    // Hash the access token and find the session
    const accessTokenHash = await hashToken(accessToken)
    const [sessionData] = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.accessTokenHash, accessTokenHash),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!sessionData) {
      return unauthorizedError
    }

    const userId = sessionData.userId

    // Query feedback with course, degree, and faculty info
    const [result] = await db
      .select({
        id: feedback.id,
        userId: feedback.userId,
        rating: feedback.rating,
        workloadRating: feedback.workloadRating,
        comment: feedback.comment,
        schoolYear: feedback.schoolYear,
        approvedAt: feedback.approvedAt,
        courseName: courses.name,
        courseCode: courses.acronym,
        courseId: courses.id,
        facultyShortName: faculties.shortName
      })
      .from(feedback)
      .innerJoin(courses, eq(feedback.courseId, courses.id))
      .innerJoin(degrees, eq(courses.degreeId, degrees.id))
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .where(and(eq(feedback.id, feedbackId), eq(feedback.userId, userId)))
      .limit(1)

    if (!result) {
      return forbiddenError
    }

    return { feedback: result }
  } catch (error) {
    console.error('Failed to load feedback:', error)
    return {
      error: 'notFound',
      message: 'Something went wrong loading your feedback. Try again?'
    }
  }
}

export default function EditFeedbackPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [points, setPoints] = useState(0)

  if ('error' in loaderData) {
    return (
      <>
        <div className="container mx-auto px-4 py-6">
          <GenericBreadcrumb
            items={[
              { label: 'Profile', href: '/profile' },
              { label: 'Edit Feedback', isActive: true }
            ]}
          />
        </div>
        <PermissionError
          message={loaderData.message || "We couldn't find that feedback."}
          onBackToProfile={() => navigate('/profile')}
        />
      </>
    )
  }

  const { feedback } = loaderData

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

  const breadcrumbItems: BreadcrumbItemData[] = [
    { label: 'Profile', href: '/profile' },
    { label: 'Edit Feedback', isActive: true }
  ]

  if (isSuccess) {
    return (
      <>
        <div className="container mx-auto px-4 py-6">
          <GenericBreadcrumb items={breadcrumbItems} />
        </div>
        <EditFeedbackSuccess
          points={points}
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
