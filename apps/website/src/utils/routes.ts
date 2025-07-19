import { Course } from '@services/meicFeedbackAPI'

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
  const url = new URL(suffix, window.location.origin)
  return url.toString()
}

export function addUtmParams(url: string, medium: string): string {
  const urlObj = new URL(url)
  urlObj.searchParams.set('utm_medium', medium)
  return urlObj.toString()
}
