import { FacultyHubContent } from '~/components/faculty/FacultyHubContent'
import { findFaculty, loadFacultyHub } from '~/lib/facultyPage.server'

import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import { detectLang, getDegreePath, getFacultyPath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/$facultySlug'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'browse')
  const lang = detectLang(location.pathname)

  if (!loaderData.faculty) {
    return buildMeta({
      matches,
      title: 'Faculty Not Found - Uni Feedback',
      description: 'The requested faculty was not found.'
    })
  }

  const { faculty, degrees, origin } = loaderData

  // Lead with the short name: students search "ist" or "nova sbe", and the
  // full name (often 50+ characters) pushed the title past truncation. The
  // full name is still in the H1 and the structured data.
  const title = t('meta.faculty_title', { shortName: faculty.shortName })

  // Each feedback once (a course shared by degrees counts in each degree)
  const totalFeedback = loaderData.hub.feedbackCount
  const description =
    totalFeedback > 0
      ? t('meta.faculty_description_reviews', {
          shortName: faculty.shortName,
          count: totalFeedback
        })
      : t('meta.faculty_description', { shortName: faculty.shortName })

  // Schema.org structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: faculty.name,
    alternateName: faculty.shortName,
    ...(faculty.slug && {
      url: `${origin}${getFacultyPath(lang, faculty.slug)}`
    }),
    // Its website and reviewed official profiles
    ...((faculty.url || loaderData.hub.links.length > 0) && {
      sameAs: [
        ...(faculty.url ? [faculty.url] : []),
        ...loaderData.hub.links.map((l) => l.url)
      ]
    }),
    ...(degrees.length > 0 && {
      department: degrees.map((degree) => ({
        '@type': 'EducationalOrganization',
        name: degree.name,
        alternateName: degree.acronym,
        ...(degree.slug && {
          url: `${origin}${getDegreePath('pt', faculty.slug!, degree.slug)}`
        })
      }))
    })
  }

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: loaderData.hub.university,
      faculty
    }),
    origin
  )

  return buildMeta({
    matches,
    title,
    description,
    url: faculty.slug
      ? `${origin}${getFacultyPath(lang, faculty.slug)}`
      : undefined,
    // EN page whose own text is all Portuguese fallback (content_translation decision 8)
    ...(lang === 'en' &&
      loaderData.hub.isMostlyFallback && { robots: 'noindex, follow' }),
    structuredData: [structuredData, breadcrumbs]
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const faculty = await findFaculty(
    request,
    params.facultySlug,
    getFacultyPath,
    detectLang
  )
  const hub = await loadFacultyHub(
    faculty,
    detectLang(new URL(request.url).pathname)
  )
  return {
    faculty,
    degrees: hub.degrees,
    hub,
    origin: getRequestOrigin(request)
  }
}

export default function FacultyPage({ loaderData }: Route.ComponentProps) {
  return (
    <FacultyHubContent faculty={loaderData.faculty} data={loaderData.hub} />
  )
}
