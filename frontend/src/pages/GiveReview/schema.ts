import { getRequiredFields, isFieldRequired } from '@utils/forms'
import { z } from 'zod'

export const formSchema = z.object({
  email: z.string().email(),
  schoolYear: z.number().min(2020).max(3050),
  facultyId: z.number(),
  degreeId: z.number(),
  courseId: z.number(),
  rating: z.number().min(0).max(5),
  workloadRating: z.number().min(0).max(5),
  comment: z.string().min(0).optional()
})
export const requiredFields = getRequiredFields(formSchema)

export const isRequired = requiredFields.reduce(
  (acc, field) => {
    acc[field] = isFieldRequired(formSchema, field)
    return acc
  },
  {} as Record<string, boolean>
)
