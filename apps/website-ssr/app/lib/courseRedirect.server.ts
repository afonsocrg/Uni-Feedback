import { findCourseRedirect } from '@uni-feedback/db'
import { redirect } from 'react-router'

/**
 * 301 to the same page of the course that replaced a deleted one (merged rows,
 * a dropped degree whose course lives on elsewhere; migration 0063). Call it
 * only once the live lookup found nothing. Swaps the id segment of the current
 * URL, so the language, the sub-page (`/feedback`) and the query string all
 * carry over. Returns when the id was never redirected.
 */
export async function redirectIfCourseMoved(
  request: Request,
  courseId: number
): Promise<void> {
  const currentId = await findCourseRedirect(courseId)
  if (currentId == null || currentId === courseId) return
  const { pathname, search } = new URL(request.url)
  const path = pathname.replace(
    new RegExp(`/${courseId}(?=/|$)`),
    `/${currentId}`
  )
  throw redirect(`${path}${search}`, { status: 301 })
}
