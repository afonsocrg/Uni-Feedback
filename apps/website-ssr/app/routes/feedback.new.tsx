import { getFaculties } from '@uni-feedback/api-client'
import { GiveFeedbackContent } from '~/components'
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
export async function clientLoader() {
  const faculties = await getFaculties()

  // Load saved form values from localStorage
  const savedEmail = localStorage.getItem(STORAGE_KEYS.FEEDBACK_EMAIL) || ''
  const savedFacultyId =
    Number(localStorage.getItem(STORAGE_KEYS.FEEDBACK_FACULTY_ID)) || 0
  const savedDegreeId =
    Number(localStorage.getItem(STORAGE_KEYS.FEEDBACK_DEGREE_ID)) || 0

  return {
    faculties,
    initialFormValues: {
      email: savedEmail,
      facultyId: savedFacultyId,
      degreeId: savedDegreeId
    }
  }
}

// We now handle dynamic data loading directly in the component using the API client

// export async function action({ request }: Route.ActionArgs) {
//   const formData = await request.formData()
//   console.log(formData)
//   const data = Object.fromEntries(formData)
//   console.log(data)
//   return data
//   const formData = await request.formData()
//   // Validate form data using schema
//   const validation = validateFormData(formData)
//   if (!validation.success) {
//     return {
//       error: Object.values(validation.errors).flat().join(', '),
//       success: false,
//       fieldErrors: validation.errors
//     }
//   }
//   try {
//     const { email, schoolYear, courseId, rating, workloadRating, comment } =
//       validation.data
//     // Prepare feedback submission
//     const feedbackData: FeedbackSubmission = {
//       email,
//       schoolYear,
//       courseId,
//       rating,
//       workloadRating,
//       comment: comment || undefined
//     }
//     // Submit feedback using the API client
//     const result = await submitFeedback(feedbackData)
//     return {
//       success: true,
//       feedback: result
//     }
//   } catch (error) {
//     console.error('Failed to submit feedback:', error)
//     if (error instanceof MeicFeedbackAPIError) {
//       return {
//         error: error.message,
//         success: false
//       }
//     }
//     return {
//       error: 'Failed to submit feedback. Please try again.',
//       success: false
//     }
//   }
// }

export default function GiveFeedbackPage({
  loaderData,
  actionData
}: Route.ComponentProps) {
  return (
    <GiveFeedbackContent
      faculties={loaderData.faculties}
      initialFormValues={loaderData.initialFormValues}
      actionData={actionData}
    />
  )
}
