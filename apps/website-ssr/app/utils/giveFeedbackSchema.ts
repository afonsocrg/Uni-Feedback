import { z } from 'zod'

export const giveFeedbackSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  schoolYear: z.number().min(2020, 'Invalid school year').max(3050, 'Invalid school year'),
  facultyId: z.number().min(1, 'Please select a faculty'),
  degreeId: z.number().min(1, 'Please select a degree'),
  courseId: z.number().min(1, 'Please select a course'),
  rating: z.number().min(1, 'Please rate the course').max(5, 'Rating cannot exceed 5'),
  workloadRating: z.number().min(1, 'Please rate the workload').max(5, 'Rating cannot exceed 5'),
  comment: z.string().optional()
})

export type GiveFeedbackFormData = z.infer<typeof giveFeedbackSchema>

export const requiredFields = ['email', 'schoolYear', 'facultyId', 'degreeId', 'courseId', 'rating', 'workloadRating'] as const

export function validateFormData(formData: FormData): { success: true; data: GiveFeedbackFormData } | { success: false; errors: Record<string, string[]> } {
  const data = {
    email: formData.get('email') as string,
    schoolYear: parseInt(formData.get('schoolYear') as string),
    facultyId: parseInt(formData.get('facultyId') as string),
    degreeId: parseInt(formData.get('degreeId') as string),
    courseId: parseInt(formData.get('courseId') as string),
    rating: parseInt(formData.get('rating') as string),
    workloadRating: parseInt(formData.get('workloadRating') as string),
    comment: formData.get('comment') as string || ''
  }

  const result = giveFeedbackSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors: Record<string, string[]> = {}
  result.error.errors.forEach((error) => {
    const field = error.path[0] as string
    if (!errors[field]) {
      errors[field] = []
    }
    errors[field].push(error.message)
  })

  return { success: false, errors }
}