import { type Feedback } from '@services/meicFeedbackAPI'

/**
 * Calculate the average workload rating from an array of feedback
 * @param feedback - Array of feedback objects
 * @returns Object with exact average and rounded rating for labels, or null if no feedback has workload ratings
 */
export function calculateAverageWorkload(feedback: Feedback[]): { exact: number; rounded: number } | null {
  const feedbackWithWorkload = feedback.filter(f => f.workloadRating !== null && f.workloadRating !== undefined)
  
  if (feedbackWithWorkload.length === 0) {
    return null
  }
  
  const sum = feedbackWithWorkload.reduce((acc, f) => acc + f.workloadRating, 0)
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