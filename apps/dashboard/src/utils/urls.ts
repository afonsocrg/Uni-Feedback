/**
 * Utility functions for handling URLs
 */

/**
 * Origin of the student-facing website, for links the dashboard hands out.
 */
export function getWebsiteUrl(): string {
  return (
    import.meta.env.VITE_WEBSITE_URL ||
    window.location.origin.replace(':5174', ':5173')
  )
}

/**
 * Opens a course page in the main website
 * @param courseId - The ID of the course to open
 */
export function openCourseInWebsite(courseId: number): void {
  const courseUrl = `${getWebsiteUrl()}/courses/${courseId}`
  window.open(courseUrl, '_blank')
}
