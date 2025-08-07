/**
 * Utility functions for handling URLs
 */

/**
 * Opens a course page in the main website
 * @param courseId - The ID of the course to open
 */
export function openCourseInWebsite(courseId: number): void {
  const websiteUrl =
    import.meta.env.VITE_WEBSITE_URL ||
    window.location.origin.replace(':5174', ':5173')
  const courseUrl = `${websiteUrl}/courses/${courseId}`
  window.open(courseUrl, '_blank')
}
