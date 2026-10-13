import { type Feedback } from '@uni-feedback/db/schema'

/**
 * Calculate the average workload rating from an array of feedback
 * @param feedback - Array of feedback objects
 * @returns Object with exact average and rounded rating for labels, or null if no feedback has workload ratings
 */
export function calculateAverageWorkload(
  feedback: Feedback[]
): { exact: number; rounded: number } | null {
  const feedbackWithWorkload = feedback.filter(
    (f) => f.workloadRating !== null && f.workloadRating !== undefined
  )

  if (feedbackWithWorkload.length === 0) {
    return null
  }

  const sum = feedbackWithWorkload.reduce(
    (acc, f) => acc + (f.workloadRating ?? 0),
    0
  )
  const exact = Math.round((sum / feedbackWithWorkload.length) * 10) / 10 // Round to 1 decimal place
  const rounded = Math.round(sum / feedbackWithWorkload.length) // Round to nearest integer for label

  return { exact, rounded }
}

/**
 * Format ECTS credits display
 * @param ects - Number of ECTS credits (if available)
 * @returns Formatted ECTS string or null if not available
 */
export function formatECTS(ects: number | null | undefined): string | null {
  if (!ects) return null
  return `${ects} ECTS`
}

/**
 * Format terms display
 * @param terms - Array of term strings
 * @returns Formatted terms string
 */
export function formatTerms(terms: string[]): string {
  if (terms.length === 0) return 'Not specified'
  if (terms.length === 1) return `${terms[0]} semester`
  return terms.join(', ') + ' semesters'
}

/**
 * Whether a course page has enough content to be worth indexing.
 *
 * Most of the catalogue is imported course listings that nobody has reviewed
 * yet and that came without a syllabus. Those pages are near-identical shells,
 * and thousands of them dilute crawl budget and site quality signals, so they
 * are `noindex` and left out of the sitemap until they get feedback or
 * content. Shared by the course page's meta and the sitemap so both agree.
 */
export function isCourseIndexable(course: {
  totalFeedbackCount: number
  description: string | null
  assessment: string | null
  bibliography: string | null
}): boolean {
  return (
    course.totalFeedbackCount > 0 ||
    [course.description, course.assessment, course.bibliography].some((text) =>
      Boolean(text?.trim())
    )
  )
}
