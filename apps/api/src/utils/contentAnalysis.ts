import { countWords } from '@uni-feedback/utils'

export interface AnalysisResult {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
  wordCount: number
}

/**
 * Analyze a feedback comment to determine content categories and word count.
 *
 * STUB IMPLEMENTATION: Currently returns random values for category detection.
 * This should be replaced with actual keyword matching or AI-based analysis.
 *
 * @param comment - The feedback comment to analyze (can be null)
 * @returns Analysis result with category flags and word count
 */
export function analyzeComment(comment: string | null): AnalysisResult {
  if (!comment) {
    return {
      hasTeaching: false,
      hasAssessment: false,
      hasMaterials: false,
      hasTips: false,
      wordCount: 0
    }
  }

  // Count words using shared utility
  const wordCount = countWords(comment)

  // STUB: Return random values for now (to be replaced with actual logic later)
  // TODO: Implement keyword-based or AI-based category detection
  return {
    hasTeaching: Math.random() > 0.5,
    hasAssessment: Math.random() > 0.5,
    hasMaterials: Math.random() > 0.5,
    hasTips: Math.random() > 0.5,
    wordCount
  }
}
