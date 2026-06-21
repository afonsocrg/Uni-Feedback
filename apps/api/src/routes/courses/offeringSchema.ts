import { z } from 'zod'

/** Zod schema for a course offering as returned by `offeringsSubquery()`. */
export const AcademicTermSchema = z.object({
  name: z.string(),
  startTick: z.number(),
  endTick: z.number()
})

export const CourseOfferingSchema = z.object({
  curriculumYear: z.number().nullable(),
  academicTerm: AcademicTermSchema
})
