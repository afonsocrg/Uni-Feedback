import type { CorrectionRequestField } from '@uni-feedback/api-client'

/**
 * The long-form markdown fields rendered as their own section on the course
 * page. These are the crowd-maintained ones: the correction dialog turns its
 * notes box into an editor for them, seeded with what the page shows today, so
 * the student hands back the full text they think we should have. Every other
 * field is a single value, where describing the change beats retyping it.
 */
const CONTENT_FIELDS = ['description', 'assessment', 'bibliography'] as const

export type CourseContentField = (typeof CONTENT_FIELDS)[number]

export function isCourseContentField(
  field: CorrectionRequestField
): field is CourseContentField {
  return (CONTENT_FIELDS as readonly string[]).includes(field)
}
