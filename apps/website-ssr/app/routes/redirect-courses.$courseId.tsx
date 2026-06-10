import { redirect } from 'react-router'

import { getCoursePath } from '~/utils/i18n-routes'
import type { Route } from './+types/redirect-courses.$courseId'

export function loader({ params }: Route.LoaderArgs) {
  return redirect(getCoursePath('en', Number(params.courseId)), { status: 301 })
}
