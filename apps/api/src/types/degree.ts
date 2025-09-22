import type { Degree } from '@uni-feedback/db/schema'

// Re-export the base database type
export type { Degree }

// Extended business logic types
export interface DegreeWithCounts extends Degree {
  courseCount: number
  feedbackCount: number
}

export interface GetDegreesOptions {
  facultyId?: number
  facultyShortName?: string
  onlyWithCourses?: boolean
}
