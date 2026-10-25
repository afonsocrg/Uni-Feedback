import { UniversitiesListContent } from '~/components/university/UniversitiesListContent'
import { loadUniversityList } from '~/lib/universityPage.server'
import {
  detectLang,
  getLocalePath,
  getUniversityPath
} from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/universities'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'university')
  const lang = detectLang(location.pathname)
  const { universities, origin } = loaderData
  return buildMeta({
    matches,
    title: t('meta.list_title'),
    description: t('meta.list_description'),
    url: `${origin}${getLocalePath('universities', lang)}`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: universities.map((u, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: u.name,
        url: `${origin}${getUniversityPath(lang, u.slug)}`
      }))
    }
  })
}

export async function loader({ request }: Route.LoaderArgs) {
  return {
    universities: await loadUniversityList(
      detectLang(new URL(request.url).pathname)
    ),
    origin: getRequestOrigin(request)
  }
}

export default function UniversitiesPage({ loaderData }: Route.ComponentProps) {
  return <UniversitiesListContent universities={loaderData.universities} />
}
