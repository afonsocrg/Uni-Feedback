import { UniversityPageContent } from '~/components/university/UniversityPageContent'
import { loadUniversityPage } from '~/lib/universityPage.server'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import {
  detectLang,
  getFacultyPath,
  getUniversityPath
} from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/university'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'university')
  const lang = detectLang(location.pathname)
  const { data, origin } = loaderData
  const { university } = data
  const url = `${origin}${getUniversityPath(lang, university.slug)}`
  return buildMeta({
    matches,
    title: t('meta.title', { shortName: university.shortName }),
    description: t('meta.description', {
      name: university.name,
      facultyCount: data.faculties.length,
      degreeCount: data.degreeCount
    }),
    url,
    // EN page whose own text is all Portuguese fallback (content_translation decision 8)
    ...(lang === 'en' &&
      data.isMostlyFallback && { robots: 'noindex, follow' }),
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollegeOrUniversity',
        name: university.name,
        alternateName: university.shortName,
        url,
        // Its website and reviewed official profiles
        ...((university.url || data.links.length > 0) && {
          sameAs: [
            ...(university.url ? [university.url] : []),
            ...data.links.map((l) => l.url)
          ]
        }),
        subOrganization: data.faculties.map((f) => ({
          '@type': 'CollegeOrUniversity',
          name: f.name,
          alternateName: f.shortName,
          url: `${origin}${getFacultyPath(lang, f.slug)}`
        }))
      },
      breadcrumbJsonLd(
        buildCrumbs(
          lang,
          metaT(location, 'common')('breadcrumb.universities'),
          {
            university
          }
        ),
        origin
      )
    ]
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

export default function UniversityPage({ loaderData }: Route.ComponentProps) {
  return <UniversityPageContent data={loaderData.data} />
}
