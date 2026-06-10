import { redirect } from 'react-router'

import { getLocalePath } from '~/utils/i18n-routes'

export function loader() {
  return redirect(getLocalePath('browse', 'en'), { status: 301 })
}
