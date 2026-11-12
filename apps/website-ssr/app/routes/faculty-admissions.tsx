import { markdownToPlainText } from '~/components/degree/content'
import {
  applySectionLabel,
  buildAdmissionsFaq,
  hasAdmissionsPage,
  isAdmissionsPageIndexable
} from '~/components/faculty/admissionsContent'
import { FacultyAdmissionsPageContent } from '~/components/faculty/FacultyAdmissionsPageContent'
import {
  findFaculty,
  loadFacultyAdmissionsPage
} from '~/lib/facultyPage.server'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import { detectLang, getFacultyAdmissionsPath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/faculty-admissions'

/**
 * How and when to apply to a faculty's degrees (`/nova-sbe/candidaturas`, EN
 * `/en/nova-sbe/admissions`): one section per route shared by several
 * degrees, which each degree's Ingresso links to. prds/content_rich_pages.md,
 * "Candidaturas at the faculty level".
 */
export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'browse')
  if (!loaderData) {
    return buildMeta({
      matches,
      title: 'Page Not Found - Uni Feedback',
      description: 'The requested page was not found.'
    })
  }
  const { faculty, data, origin, lang } = loaderData
  const url = `${origin}${getFacultyAdmissionsPath(lang, faculty.slug!)}`
  const labels = data.sections
    .filter((s) => s.view.scope.level !== 'national')
    .map((s) => applySectionLabel(t, s))

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: data.university,
      faculty,
      current: t('faculty_admissions.crumb')
    }),
    origin,
    url
  )

  const faq = buildAdmissionsFaq(t, lang, faculty.shortName, data)
  const faqPage =
    faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.isMarkdown
                ? markdownToPlainText(item.answer)
                : item.answer
            }
          }))
        }
      : null

  return buildMeta({
    matches,
    title: t('faculty_admissions.meta_title', { name: faculty.shortName }),
    description:
      labels.length > 0
        ? t('faculty_admissions.meta_description', {
            name: faculty.shortName,
            routes: labels.join(', ')
          })
        : t('faculty_admissions.meta_description_short', {
            name: faculty.shortName
          }),
    url,
    robots: isAdmissionsPageIndexable(data) ? undefined : 'noindex, follow',
    structuredData: [breadcrumbs, ...(faqPage ? [faqPage] : [])]
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const lang = detectLang(new URL(request.url).pathname)
  const faculty = await findFaculty(
    request,
    params.facultySlug,
    getFacultyAdmissionsPath,
    detectLang
  )
  const data = await loadFacultyAdmissionsPage(faculty, lang)
  // Nothing of the faculty's own (no rounds or guides, or only the national
  // contest): no page
  if (!hasAdmissionsPage(data)) {
    throw new Response('Not found', { status: 404 })
  }
  return { faculty, data, lang, origin: getRequestOrigin(request) }
}

export default function FacultyAdmissionsPage({
  loaderData
}: Route.ComponentProps) {
  return (
    <FacultyAdmissionsPageContent
      faculty={loaderData.faculty}
      data={loaderData.data}
    />
  )
}
