import { getRequiredFields, isFieldRequired } from '@utils/forms'
import { z } from 'zod'

export const formSchema = z.object({
  email: z
    .string()
    .email()
    .refine(
      (email) =>
        email.endsWith('@tecnico.ulisboa.pt') ||
        email.endsWith('@ist.utl.pt') ||
        email.endsWith('@novasbe.pt') ||
        email.endsWith('@fct.unl.p'),
      'Please enter your university email address'
    ),
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
