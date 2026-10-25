import type { CorrectionRequestField } from '@uni-feedback/api-client'
import type { CourseSectionId } from '~/utils/analytics'

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

/**
 * The course page's sections, in page order, by their anchor (`#avaliacao`).
 * Anchors are Portuguese on both languages' pages, like the degree page's.
 */
export const COURSE_SECTION_IDS = {
  feedback: 'feedback',
  description: 'sobre',
  assessment: 'avaliacao',
  bibliography: 'bibliografia'
} as const satisfies Record<'feedback' | CourseContentField, CourseSectionId>
