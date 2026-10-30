import { database, schema } from '@uni-feedback/db'
import { isDiscontinued } from '@uni-feedback/utils'
import { and, asc, eq, isNotNull } from 'drizzle-orm'
import { useEffect } from 'react'
import { DegreePageContent } from '~/components'
import {
  buildFaq,
  computeHighlights,
  formatSchoolYear,
  latestGrades,
  markdownToPlainText,
  mergeFaq
} from '~/components/degree/content'
import {
  findDegreeBySlugs,
  loadAcademicTerms,
  loadDegreeCourses
} from '~/lib/degreeCourses.server'
import { loadDegreePageExtras } from '~/lib/degreePage.server'
import { userPreferences } from '~/utils'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'

import {
  detectLang,
  getDegreeCoursesPath,
  getDegreePath
} from '~/utils/i18n-routes'
import {
  isMostlyFallback,
  pickText,
  type ContentLang
} from '~/utils/localizedContent'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/$facultySlug.$degreeSlug'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'browse')
  const lang = detectLang(location.pathname)

  if (!loaderData.faculty || !loaderData.degree) {
    return buildMeta({
      matches,
      title: 'Page Not Found - Uni Feedback',
      description: 'The requested page was not found.'
    })
  }

  const { faculty, degree, courses, origin, extras } = loaderData

  // Lead with the acronym: students search "meic ist", not the degree's full
  // name, and a long title gets cut before the acronym ever shows. The entry
  // grade joins the title only when the page shows one (licenciaturas with
  // DGES data): "LEIC-A IST: plano curricular, opiniões e média de entrada".
  const { latest: latestGrade } = latestGrades(extras.admissions)
  const title = t(
    latestGrade ? 'meta.degree_title_full' : 'meta.degree_title_plan',
    { acronym: degree.acronym, faculty: faculty.shortName }
  )

  const totalFeedback = courses.reduce(
    (sum, c) => sum + Number(c.totalFeedbackCount),
    0
  )
  const descriptionParams = {
    degreeName: degree.name,
    acronym: degree.acronym,
    faculty: faculty.shortName
  }
  const summary =
    totalFeedback > 0
      ? t('meta.degree_description_reviews', {
          ...descriptionParams,
          count: totalFeedback
        })
      : t('meta.degree_description', descriptionParams)
  // Long degree names push the description past what Google shows (~160
  // characters), so the generic tail goes first, keeping the name and count.
  const withTail = `${summary} ${t('meta.degree_description_tail')}`
  const description = withTail.length <= 160 ? withTail : summary

  // What the degree offers today. Discontinued courses keep their pages (and
  // count towards the review total above), but are not part of the degree now.
  const offeredCourses = courses.filter(
    (c) => !isDiscontinued(c.lastTaughtYear)
  )

  const pageUrl =
    faculty.slug && degree.slug
      ? `${origin}${getDegreePath(lang, faculty.slug, degree.slug)}`
      : undefined

  // The program and its facts: only what the page shows, nothing guessed.
  const semesters = degree.durationSemesters
  const program = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalProgram',
    name: degree.name,
    alternateName: degree.acronym,
    ...(pageUrl && { url: pageUrl }),
    provider: {
      '@type': 'CollegeOrUniversity',
      name: faculty.name,
      alternateName: faculty.shortName,
      ...(faculty.url && { sameAs: faculty.url })
    },
    educationalCredentialAwarded: t(`degree_page.facts.type.${degree.type}`),
    ...(semesters && {
      timeToComplete:
        semesters % 2 === 0 ? `P${semesters / 2}Y` : `P${semesters * 6}M`
    }),
    ...(degree.ects && { numberOfCredits: degree.ects }),
    ...(degree.teachingLanguage && {
      inLanguage:
        degree.teachingLanguage === 'pt_en'
          ? ['pt', 'en']
          : degree.teachingLanguage
    }),
    ...(degree.schedule && {
      timeOfDay:
        degree.schedule === 'daytime'
          ? 'Morning'
          : degree.schedule === 'after_work'
            ? 'Evening'
            : ['Morning', 'Evening']
    }),
    ...(extras.campuses.length > 0 && {
      location: extras.campuses.map((campus) => ({
        '@type': 'Place',
        name: campus.name,
        ...(campus.address && {
          address: {
            '@type': 'PostalAddress',
            streetAddress: campus.address,
            ...(campus.postalCode && { postalCode: campus.postalCode }),
            ...(campus.city && { addressLocality: campus.city }),
            addressCountry: 'PT'
          }
        }),
        ...(campus.latitude !== null &&
          campus.longitude !== null && {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: campus.latitude,
              longitude: campus.longitude
            }
          })
      }))
    }),
    ...(extras.admissions?.guide?.nextYearVagas && {
      maximumEnrollment: extras.admissions.guide.nextYearVagas.vagas
    }),
    ...(extras.fees && {
      offers: extras.fees.rows.map((row) => ({
        '@type': 'Offer',
        category: `${t('degree_page.fees.label', {
          period: t(`degree_page.fees.period.${row.period}`, {
            defaultValue: row.period
          }),
          student: t(`degree_page.fees.student.${row.studentType}`, {
            defaultValue: row.studentType
          })
        })}, ${formatSchoolYear(extras.fees!.schoolYear)}`,
        price: row.amountEur,
        priceCurrency: 'EUR'
      }))
    })
  }

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: loaderData.university,
      faculty,
      degree
    }),
    origin
  )

  // FAQPage only for the questions the page actually shows, built by the same
  // function from the same data
  const workloadLabels = metaT(location, 'common')('workload_ratings', {
    returnObjects: true
  }) as string[]
  const faq = mergeFaq(
    loaderData.curatedFaq,
    buildFaq(t, lang, {
      acronym: degree.acronym,
      admissions: extras.admissions,
      fees: extras.fees,
      outcomes: extras.outcomes,
      highlights: computeHighlights(courses),
      isRetired:
        offeredCourses.length === 0 &&
        courses.some((course) => isDiscontinued(course.lastTaughtYear)),
      workloadLabel: (rating) => workloadLabels[Math.round(rating) - 1] ?? ''
    })
  )
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

  const structuredData = [program, breadcrumbs, ...(faqPage ? [faqPage] : [])]

  return buildMeta({
    matches,
    title,
    description,
    url: pageUrl,
    // EN page whose own text is all Portuguese fallback (content_translation decision 8)
    ...(lang === 'en' &&
      isMostlyFallback([loaderData.about]) && { robots: 'noindex, follow' }),
    structuredData
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { faculty, degree, university } = await findDegreeBySlugs(
    request,
    params.facultySlug,
    params.degreeSlug,
    getDegreePath
  )
  const db = database()

  // Our own description, once reviewed: in the page's language, else the
  // Portuguese one with an "Available in Portuguese only" note (pickText).
  const detailsQuery = db
    .select({
      lang: schema.degreeDetails.lang,
      description: schema.degreeDetails.description
    })
    .from(schema.degreeDetails)
    .where(
      and(
        eq(schema.degreeDetails.degreeId, degree.id),
        isNotNull(schema.degreeDetails.reviewedAt)
      )
    )

  // Curated FAQ (migration 0057): reviewed rows in the page's language, in
  // order. Shown before the generated questions, replacing any on its topic.
  const curatedFaqQuery = db
    .select({
      topic: schema.degreeFaqs.topic,
      question: schema.degreeFaqs.question,
      answer: schema.degreeFaqs.answer
    })
    .from(schema.degreeFaqs)
    .where(
      and(
        eq(schema.degreeFaqs.degreeId, degree.id),
        eq(schema.degreeFaqs.lang, detectLang(new URL(request.url).pathname)),
        isNotNull(schema.degreeFaqs.reviewedAt)
      )
    )
    .orderBy(asc(schema.degreeFaqs.position))

  const [courses, academicTerms, details, extras, curatedFaq] =
    await Promise.all([
      loadDegreeCourses(degree.id, detectLang(new URL(request.url).pathname)),
      loadAcademicTerms(faculty.id),
      detailsQuery,
      loadDegreePageExtras(
        degree,
        faculty.universityId,
        detectLang(new URL(request.url).pathname)
      ),
      curatedFaqQuery
    ])

  return {
    faculty,
    degree,
    university,
    about: pickText(
      detectLang(new URL(request.url).pathname),
      Object.fromEntries(
        details.map((d) => [d.lang as ContentLang, d.description])
      )
    ),
    courses,
    academicTerms,
    extras,
    curatedFaq,
    origin: getRequestOrigin(request)
  }
}

export default function DegreePage({ loaderData }: Route.ComponentProps) {
  const { faculty, degree } = loaderData
  // Remember the degree. The navbar's "Procurar cadeiras" and other "continue"
  // shortcuts take a returning student to its course browser, which is where
  // they come back to find a course.
  useEffect(() => {
    if (faculty?.slug && degree?.slug) {
      userPreferences.set({
        lastSelectedFacultySlug: faculty.slug,
        lastSelectedDegreeSlug: degree.slug,
        lastVisitedPath: getDegreeCoursesPath(
          detectLang(window.location.pathname),
          faculty.slug,
          degree.slug
        )
      })
    }
  }, [faculty?.slug, degree?.slug])

  return (
    <DegreePageContent
      faculty={loaderData.faculty}
      degree={loaderData.degree}
      university={loaderData.university}
      about={loaderData.about}
      courses={loaderData.courses}
      academicTerms={loaderData.academicTerms}
      extras={loaderData.extras}
      curatedFaq={loaderData.curatedFaq}
    />
  )
}
