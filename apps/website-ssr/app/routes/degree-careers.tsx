import { database, schema } from '@uni-feedback/db'
import { and, eq, isNotNull } from 'drizzle-orm'
import { useTranslation } from 'react-i18next'
import { markdownToPlainText } from '~/components/degree/content'
import { DegreeCareersPage } from '~/components/degree/DegreeCareersPage'
import { buildCareersFaq } from '~/components/degree/subpageContent'
import { hasCareersPage } from '~/components/degree/subpages'
import { useLang } from '~/hooks'
import { findDegreeBySlugs } from '~/lib/degreeCourses.server'
import { loadDegreeExtrasWithSources } from '~/lib/degreePage.server'
import { loadCareersPageData } from '~/lib/degreeSubpages.server'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import { detectLang, getDegreeCareersPath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/degree-careers'

/**
 * A degree's careers page (`/ist/leic-a/saidas-profissionais`, EN
 * `.../careers`): prds/content_rich_pages.md decision 22 and
 * prds/career_outcomes.md. InfoCursos figures only, framed as agreed
 * ("Empregabilidade" = not registered as unemployed at the IEFP).
 */
export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'browse')
  const lang = detectLang(location.pathname)

  if (!loaderData?.faculty || !loaderData.degree) {
    return buildMeta({
      matches,
      title: 'Page Not Found - Uni Feedback',
      description: 'The requested page was not found.'
    })
  }

  const { faculty, degree, extras, data, origin } = loaderData
  const params = {
    degreeName: degree.name,
    acronym: degree.acronym,
    faculty: faculty.shortName
  }

  const hasSlugs = Boolean(faculty.slug && degree.slug)
  const pageUrl = hasSlugs
    ? `${origin}${getDegreeCareersPath(lang, faculty.slug!, degree.slug!)}`
    : undefined

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: loaderData.university,
      faculty,
      degree,
      current: t('degree_subpages.tabs.careers')
    }),
    origin,
    pageUrl
  )

  const faq = buildCareersFaq(t, lang, degree.acronym, extras, data)
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

  // Only prompts and no data: not worth indexing until it has some
  const hasData = extras.outcomes !== null || data.infocursos !== null

  return buildMeta({
    matches,
    title: t('degree_subpages.careers.meta_title', params),
    description: t('degree_subpages.careers.meta_description', params),
    url: pageUrl,
    robots: hasData ? undefined : 'noindex, follow',
    structuredData: [breadcrumbs, ...(faqPage ? [faqPage] : [])]
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { faculty, degree, university } = await findDegreeBySlugs(
    request,
    params.facultySlug,
    params.degreeSlug,
    getDegreeCareersPath
  )
  if (!hasCareersPage(degree.type)) {
    throw new Response('Not found', { status: 404 })
  }

  const db = database()
  const [{ extras, outcomesPair }, [about]] = await Promise.all([
    loadDegreeExtrasWithSources(
      degree.id,
      faculty.universityId,
      detectLang(new URL(request.url).pathname)
    ),
    db
      .select({ degreeId: schema.degreeDetails.degreeId })
      .from(schema.degreeDetails)
      .where(
        and(
          eq(schema.degreeDetails.degreeId, degree.id),
          eq(
            schema.degreeDetails.lang,
            detectLang(new URL(request.url).pathname)
          ),
          isNotNull(schema.degreeDetails.reviewedAt)
        )
      )
  ])
  const data = await loadCareersPageData(outcomesPair)

  return {
    faculty,
    degree,
    university,
    extras,
    data,
    hasAbout: Boolean(about),
    origin: getRequestOrigin(request)
  }
}

export default function DegreeSaidasPage({ loaderData }: Route.ComponentProps) {
  const { faculty, degree, extras, data, hasAbout } = loaderData
  const { t } = useTranslation('browse')
  const lang = useLang()
  return (
    <DegreeCareersPage
      faculty={faculty}
      degree={degree}
      university={loaderData.university}
      extras={extras}
      data={data}
      hasAbout={hasAbout}
      faq={buildCareersFaq(t, lang, degree.acronym, extras, data)}
    />
  )
}
