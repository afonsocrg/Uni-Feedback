import { UniversityBachelorsContent } from '~/components/university/UniversityBachelorsContent'
import { loadUniversityPage } from '~/lib/universityPage.server'
import { detectLang, getUniversitySubpagePath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/university-bachelors'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'university')
  const lang = detectLang(location.pathname)
  const { university, bachelors } = loaderData.data
  return buildMeta({
    matches,
    title: t('meta.bachelors_title', { shortName: university.shortName }),
    description: t('meta.bachelors_description', { name: university.name }),
    url: `${loaderData.origin}${getUniversitySubpagePath(lang, university.slug, 'bachelors')}`,
    // Nothing to list yet: keep the empty page out of the index
    ...(bachelors.length === 0 && { robots: 'noindex, follow' })
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const data = await loadUniversityPage(
    params.uniSlug,
    detectLang(new URL(request.url).pathname)
  )
  if (!data) throw new Response('University not found', { status: 404 })
  return { data, origin: getRequestOrigin(request) }
}

export default function UniversityBachelorsPage({
  loaderData
}: Route.ComponentProps) {
  return <UniversityBachelorsContent data={loaderData.data} />
}
