import {
  formatSchoolYear,
  markdownToPlainText
} from '~/components/degree/content'
import { FacultyFeesPageContent } from '~/components/faculty/FacultyFeesPageContent'
import {
  buildFeesFaq,
  feeAmountText,
  FEES_PAGE_MIN_INDEXED,
  feesMetaDescription,
  feesMetaTitle,
  hasAnyFee
} from '~/components/faculty/feesContent'
import { findFaculty, loadFacultyFeesPage } from '~/lib/facultyPage.server'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import {
  detectLang,
  getDegreePath,
  getFacultyFeesPath
} from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/faculty-fees'

/**
 * A faculty's tuition fees (`/ist/propinas`, EN `/en/ist/tuition-fees`): the
 * fee of every degree this school year, by type, national and international.
 * todo "Propinas pages per faculty"; prds/content_rich_pages.md, "Fees".
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
  const year = formatSchoolYear(data.schoolYear)
  const url = `${origin}${getFacultyFeesPath(lang, faculty.slug!)}`
  const title = feesMetaTitle(t, faculty.shortName, data)
  const description = feesMetaDescription(t, lang, faculty.name, data)

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: data.university,
      faculty,
      current: t('faculty_fees.crumb')
    }),
    origin,
    url
  )

  const faq = buildFeesFaq(t, lang, faculty.shortName, data)
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

  // Each degree as a programme with its fees as offers
  const provider = {
    '@type': 'CollegeOrUniversity',
    name: faculty.name,
    url: `${origin}/${faculty.slug}`
  }
  const nextYear = formatSchoolYear(data.schoolYear + 1)
  const offer = (
    fee: { amountEur: number; period: string },
    category: 'national' | 'international',
    forYear = year
  ) => ({
    '@type': 'Offer',
    category: t(`faculty_fees.table.${category}`),
    price: fee.amountEur,
    priceCurrency: 'EUR',
    description: `${feeAmountText(t, lang, fee)}, ${forYear}`
  })
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('faculty_fees.title', { name: faculty.name, year }),
    itemListElement: data.degrees.filter(hasAnyFee).map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'EducationalOccupationalProgram',
        name: d.name,
        ...(d.slug && {
          url: `${origin}${getDegreePath(lang, faculty.slug!, d.slug)}`
        }),
        provider,
        offers: [
          ...d.national.map((fee) => offer(fee, 'national')),
          ...d.international.map((fee) => offer(fee, 'international')),
          ...d.next.national.map((fee) => offer(fee, 'national', nextYear)),
          ...d.next.international.map((fee) =>
            offer(fee, 'international', nextYear)
          )
        ]
      }
    }))
  }

  return buildMeta({
    matches,
    title,
    description,
    url,
    robots:
      data.degrees.filter(hasAnyFee).length >= FEES_PAGE_MIN_INDEXED
        ? undefined
        : 'noindex, follow',
    structuredData: [breadcrumbs, list, ...(faqPage ? [faqPage] : [])]
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const lang = detectLang(new URL(request.url).pathname)
  const faculty = await findFaculty(
    request,
    params.facultySlug,
    getFacultyFeesPath,
    detectLang
  )
  const data = await loadFacultyFeesPage(faculty, lang)
  // No fee for this year at all: no page
  if (!data.degrees.some(hasAnyFee)) {
    throw new Response('Not found', { status: 404 })
  }
  return { faculty, data, lang, origin: getRequestOrigin(request) }
}

export default function FacultyFeesPage({ loaderData }: Route.ComponentProps) {
  return (
    <FacultyFeesPageContent
      faculty={loaderData.faculty}
      data={loaderData.data}
    />
  )
}
