import { UniversityFacultiesContent } from '~/components/university/UniversityFacultiesContent'
import { loadUniversityPage } from '~/lib/universityPage.server'
import { detectLang, getUniversitySubpagePath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/university-faculties'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'university')
  const lang = detectLang(location.pathname)
  const { university } = loaderData.data
  return buildMeta({
    matches,
    title: t('meta.faculties_title', { shortName: university.shortName }),
    description: t('meta.faculties_description', { name: university.name }),
    url: `${loaderData.origin}${getUniversitySubpagePath(lang, university.slug, 'faculties')}`
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

export default function UniversityFacultiesPage({
  loaderData
}: Route.ComponentProps) {
  return <UniversityFacultiesContent data={loaderData.data} />
}
