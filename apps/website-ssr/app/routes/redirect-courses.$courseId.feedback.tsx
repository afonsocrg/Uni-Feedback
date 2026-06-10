import { redirect } from 'react-router'

import { getCourseFeedbackPath } from '~/utils/i18n-routes'
import type { Route } from './+types/redirect-courses.$courseId.feedback'

export function loader({ request, params }: Route.LoaderArgs) {
  const { search } = new URL(request.url)
  return redirect(
    getCourseFeedbackPath('en', Number(params.courseId)) + search,
    { status: 301 }
  )
}
