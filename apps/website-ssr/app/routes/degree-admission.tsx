import { useTranslation } from 'react-i18next'
import { DegreeAdmissionPage } from '~/components/degree/DegreeAdmissionPage'
import { latestGrades, markdownToPlainText } from '~/components/degree/content'
import { buildAdmissionFaq } from '~/components/degree/subpageContent'
import { CNA_TYPES, hasAdmissionPage } from '~/components/degree/subpages'
import { useLang } from '~/hooks'
import { findDegreeBySlugs } from '~/lib/degreeCourses.server'
import { loadDegreeExtrasWithSources } from '~/lib/degreePage.server'
import { loadAdmissionPageData } from '~/lib/degreeSubpages.server'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import { detectLang, getDegreeAdmissionPath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/degree-admission'

/**
 * A degree's admission page (`/ist/leic-a/ingresso`, EN `.../admission`):
 * prds/content_rich_pages.md decision 22, a query-specific page ("média de
 * entrada LEIC") next to the degree page's Ingresso summary.
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
  const isCna = CNA_TYPES.has(degree.type)
  const { latest } = latestGrades(extras.admissions)
  const title = t(
    isCna && latest
      ? 'degree_subpages.admission.meta_title'
      : 'degree_subpages.admission.meta_title_direct',
    params
  )
  const hasRounds = extras.applyRoutes.some((r) => r.rounds.length > 0)
  const description = t(
    isCna
      ? 'degree_subpages.admission.meta_description'
      : hasRounds
        ? 'degree_subpages.admission.meta_description_apply'
        : 'degree_subpages.admission.meta_description_direct',
    params
  )

  const hasSlugs = Boolean(faculty.slug && degree.slug)
  const pageUrl = hasSlugs
    ? `${origin}${getDegreeAdmissionPath(lang, faculty.slug!, degree.slug!)}`
    : undefined

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: loaderData.university,
      faculty,
      degree,
      current: t('degree_subpages.tabs.admission')
    }),
    origin,
    pageUrl
  )

  const faq = buildAdmissionFaq(t, lang, degree.acronym, extras, data)
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
  const hasData =
    extras.applyRoutes.length > 0 ||
    extras.admissions !== null ||
    extras.fees !== null ||
    data.feeHistory.length > 0

  return buildMeta({
    matches,
    title,
    description,
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
    getDegreeAdmissionPath
  )
  if (!hasAdmissionPage(degree.type)) {
    throw new Response('Not found', { status: 404 })
  }

  const lang = detectLang(new URL(request.url).pathname)
  const { extras, ...sources } = await loadDegreeExtrasWithSources(
    degree,
    faculty.universityId,
    lang
  )
  const data = await loadAdmissionPageData(degree.id, sources)

  return {
    faculty,
    degree,
    university,
    extras,
    data,
    origin: getRequestOrigin(request)
  }
}

export default function DegreeIngressoPage({
  loaderData
}: Route.ComponentProps) {
  const { faculty, degree, extras, data } = loaderData
  return (
    <DegreeAdmissionPage
      faculty={faculty}
      degree={degree}
      university={loaderData.university}
      extras={extras}
      data={data}
      faq={useAdmissionFaq(degree.acronym, extras, data)}
    />
  )
}

function useAdmissionFaq(
  acronym: string,
  extras: Route.ComponentProps['loaderData']['extras'],
  data: Route.ComponentProps['loaderData']['data']
) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  return buildAdmissionFaq(t, lang, acronym, extras, data)
}
