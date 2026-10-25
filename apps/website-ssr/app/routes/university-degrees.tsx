import { UniversityDegreesContent } from '~/components/university/UniversityDegreesContent'
import { loadUniversityPage } from '~/lib/universityPage.server'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import { facultyTypeFromSegment } from '~/utils/facultyTypePages'
import {
  detectLang,
  getDegreePath,
  getUniversitySubpagePath,
  getUniversityTypePath
} from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/university-degrees'

/** Fewer degrees than this and a type page stays out of the index */
const MIN_INDEXED_DEGREES = 3

/**
 * A university's degrees: /unis/ulisboa/cursos (all of them) and one type
 * across its faculties (/unis/ulisboa/mestrados, /en/unis/nova/phd, ...).
 * One file behind six routes; the last segment names the type.
 */
function typeFromUrl(pathname: string) {
  const lang = detectLang(pathname)
  const segment = pathname.replace(/\/+$/, '').split('/').at(-1) ?? ''
  const type = facultyTypeFromSegment(segment, lang)
  // Licenciaturas have their own route; anything else here is `/cursos`
  return { lang, type: type === 'bachelor' ? null : type }
}

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'university')
  const tb = metaT(location, 'browse')
  const { data, type, lang, origin } = loaderData
  const { university } = data
  const degrees = type
    ? data.degrees.filter((d) => d.type === type)
    : data.degrees
  const url = `${origin}${
    type
      ? getUniversityTypePath(lang, university.slug, type)
      : getUniversitySubpagePath(lang, university.slug, 'degrees')
  }`
  const typeLabel = type ? tb(`degree_types.${type}`) : null
  const crumb = typeLabel ?? t('crumbs.degrees')
  return buildMeta({
    matches,
    title: typeLabel
      ? t('meta.type_title', {
          type: typeLabel,
          shortName: university.shortName
        })
      : t('meta.degrees_title', { shortName: university.shortName }),
    description: typeLabel
      ? t('meta.type_description', {
          count: degrees.length,
          n: degrees.length,
          type: typeLabel.toLowerCase(),
          name: university.name,
          faculties: data.faculties.length
        })
      : t('meta.degrees_description', {
          name: university.name,
          count: degrees.length,
          faculties: data.faculties.length
        }),
    url,
    ...(degrees.length < MIN_INDEXED_DEGREES && {
      robots: 'noindex, follow'
    }),
    structuredData: [
      breadcrumbJsonLd(
        buildCrumbs(
          lang,
          metaT(location, 'common')('breadcrumb.universities'),
          {
            university,
            current: crumb
          }
        ),
        origin,
        url
      ),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${crumb} ${university.shortName}`,
        itemListElement: degrees.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: d.name,
          url: `${origin}${getDegreePath(lang, d.facultySlug, d.slug)}`
        }))
      }
    ]
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { lang, type } = typeFromUrl(new URL(request.url).pathname)
  const data = await loadUniversityPage(params.uniSlug, lang)
  if (!data) throw new Response('University not found', { status: 404 })
  // A type the university doesn't teach has no page
  if (type && !data.degrees.some((d) => d.type === type)) {
    throw new Response('Not found', { status: 404 })
  }
  return { data, type, lang, origin: getRequestOrigin(request) }
}

export default function UniversityDegreesPage({
  loaderData
}: Route.ComponentProps) {
  return (
    <UniversityDegreesContent data={loaderData.data} type={loaderData.type} />
  )
}
