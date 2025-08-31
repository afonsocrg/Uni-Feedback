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
