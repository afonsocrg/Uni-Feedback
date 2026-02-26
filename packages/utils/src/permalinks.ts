/**
 * Generate a permalink for a specific feedback item
 * @param courseId - The ID of the course
 * @param feedbackId - The ID of the feedback
 * @returns The permalink path (without domain)
 */
export function getFeedbackPermalink(
  courseId: number,
  feedbackId: number
): string {
  return `/courses/${courseId}#feedback-${feedbackId}`
}

/**
 * Generate a full permalink URL for a specific feedback item
 * @param baseUrl - The base URL (e.g., https://example.com)
 * @param courseId - The ID of the course
 * @param feedbackId - The ID of the feedback
 * @returns The full permalink URL
 */
export function getFeedbackPermalinkUrl(
  baseUrl: string,
  courseId: number,
  feedbackId: number
): string {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${cleanBaseUrl}${getFeedbackPermalink(courseId, feedbackId)}`
}
