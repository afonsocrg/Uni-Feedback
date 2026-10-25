import { FacultyTypePageContent } from '~/components/faculty/FacultyTypePageContent'
import { findFaculty, loadFacultyTypePage } from '~/lib/facultyPage.server'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import {
  facultyTypeFromSegment,
  getFacultyTypePath
} from '~/utils/facultyTypePages'
import { detectLang, getFacultyPath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/faculty-degree-type'

/**
 * A faculty's degrees of one type: /ist/licenciaturas, /en/ist/masters, ...
 * One file behind the six `faculty-*` routes; the type is the last segment.
 */
function typeFromUrl(pathname: string) {
  const lang = detectLang(pathname)
  const segment = pathname.replace(/\/+$/, '').split('/').at(-1) ?? ''
  return { lang, type: facultyTypeFromSegment(segment, lang) }
}

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'browse')
  if (!loaderData) {
    return buildMeta({
      matches,
      title: 'Page Not Found - Uni Feedback',
      description: 'The requested page was not found.'
    })
  }
  const { faculty, type, data, origin, lang } = loaderData
  const typeLabel = t(`degree_types.${type}`)
  const url = `${origin}${getFacultyTypePath(lang, faculty.slug!, type)}`
  const title = t('meta.faculty_type_title', {
    type: typeLabel,
    shortName: faculty.shortName
  })
  const description = t('meta.faculty_type_description', {
    type: typeLabel.toLowerCase(),
    name: faculty.name,
    count: data.degrees.length,
    acronyms: data.degrees
      .slice(0, 6)
      .map((d) => d.acronym)
      .join(', ')
  })

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: data.university,
      faculty,
      current: typeLabel
    }),
    origin,
    url
  )
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${typeLabel} ${faculty.shortName}`,
    itemListElement: data.degrees.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: d.name,
      ...(d.slug && {
        url: `${origin}${getFacultyPath(lang, faculty.slug!)}/${d.slug}`
      })
    }))
  }

  return buildMeta({
    matches,
    title,
    description,
    url,
    structuredData: [breadcrumbs, list]
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { lang, type } = typeFromUrl(new URL(request.url).pathname)
  if (!type) throw new Response('Not found', { status: 404 })
  const faculty = await findFaculty(
    request,
    params.facultySlug,
    (l, slug) => getFacultyTypePath(l, slug, type),
    detectLang
  )
  const data = await loadFacultyTypePage(faculty, type, lang)
  // A type the faculty doesn't teach has no page
  if (data.degrees.length === 0) {
    throw new Response('Not found', { status: 404 })
  }
  return { faculty, type, data, lang, origin: getRequestOrigin(request) }
}

export default function FacultyTypePage({ loaderData }: Route.ComponentProps) {
  return (
    <FacultyTypePageContent
      faculty={loaderData.faculty}
      type={loaderData.type}
      data={loaderData.data}
    />
  )
}
