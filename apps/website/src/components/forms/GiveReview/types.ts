import { Course, Degree } from '@/services/meicFeedbackAPI'
import { GiveReviewFormValues } from '@pages'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

export interface GiveReviewProps {
  form: UseFormReturn<GiveReviewFormValues>
  courses: Course[]
  schoolYears: number[]
  isSubmitting: boolean
  onSubmit: (values: GiveReviewFormValues) => Promise<void>
  localDegreeId: number | null
  setLocalDegreeId?: (degreeId: number | null) => void
  contextDegree: Degree | null
  schema?: z.ZodSchema
  isFormValid?: boolean
  isLoadingFormData?: boolean
}
