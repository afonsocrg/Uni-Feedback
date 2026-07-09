import type { Course } from '@uni-feedback/db/schema'

interface ReviewPathParams {
  courseId?: number
}

export function getReviewPath({ courseId }: ReviewPathParams = {}) {
  const params = new URLSearchParams()
  if (courseId) {
    params.set('courseId', courseId.toString())
  }
  return `/feedback/new?${params.toString()}`
}

export function getCoursePath(course: Course) {
  return `/courses/${course.id}`
}

export function getFullUrl(suffix: string) {
  if (typeof window === 'undefined') {
    // During SSR, just return the suffix
    return suffix
  }
  const url = new URL(suffix, window.location.origin)
  return url.toString()
}

/**
 * Tags a URL for PostHog attribution. `medium` is the channel it was shared
 * through (whatsapp / copy_url / native); `source` is the surface it was shared
 * from, and is optional because most call sites only care about the channel.
 * Any `#fragment` on the URL survives, so permalinks stay permalinks.
 */
export function addUtmParams(
  url: string,
  medium: string,
  source?: string
): string {
  const urlObj = new URL(url)
  urlObj.searchParams.set('utm_medium', medium)
  if (source) urlObj.searchParams.set('utm_source', source)
  return urlObj.toString()
}
