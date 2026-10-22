import {
  database,
  findDegreeSlugRedirect,
  offeringsSubquery,
  schema
} from '@uni-feedback/db'
import { isDiscontinued } from '@uni-feedback/utils'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { useEffect } from 'react'
import { redirect, useLocation } from 'react-router'
import { DegreePageContent } from '~/components'
import {
  buildFaq,
  computeHighlights,
  formatSchoolYear,
  latestGrades
} from '~/components/degree/content'
import { loadDegreePageExtras } from '~/lib/degreePage.server'
import { userPreferences } from '~/utils'

import {
  detectLang,
  getCoursePath,
  getDegreePath,
  getFacultyPath,
  getLocalePath
} from '~/utils/i18n-routes'
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
    }),
    ...(offeredCourses.length > 0 && {
      hasCourse: offeredCourses.map((course) => ({
        '@type': 'Course',
        name: course.name,
        courseCode: course.acronym,
        url: `${origin}${getCoursePath(lang, course.id)}`,
        ...(Number(course.totalFeedbackCount) > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(course.averageRating).toFixed(1),
            reviewCount: course.totalFeedbackCount.toString(),
            bestRating: '5',
            worstRating: '1'
          }
        })
      }))
    })
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Uni Feedback',
        item: `${origin}${getLocalePath('browse', lang)}`
      },
      ...(faculty.slug
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: faculty.shortName,
              item: `${origin}${getFacultyPath(lang, faculty.slug)}`
            }
          ]
        : []),
      {
        '@type': 'ListItem',
        position: faculty.slug ? 3 : 2,
        name: degree.acronym,
        ...(pageUrl && { item: pageUrl })
      }
    ]
  }

  // FAQPage only for the questions the page actually shows, built by the same
  // function from the same data
  const workloadLabels = metaT(location, 'common')('workload_ratings', {
    returnObjects: true
  }) as string[]
  const faq = buildFaq(t, lang, {
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
  const faqPage =
    faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer }
          }))
        }
      : null

  const structuredData = [program, breadcrumbs, ...(faqPage ? [faqPage] : [])]

  return buildMeta({
    matches,
    title,
    description,
    url: pageUrl,
    structuredData
  })
}

// A renamed faculty or degree slug (or both): 301 to the current URL, keeping
// the language and the query string. Returns when the slugs were never renamed.
async function redirectRenamedDegree(
  request: Request,
  facultySlug: string,
  degreeSlug: string
) {
  const current = await findDegreeSlugRedirect(facultySlug, degreeSlug)
  if (!current) return
  const { pathname, search } = new URL(request.url)
  throw redirect(
    `${getDegreePath(detectLang(pathname), current.facultySlug, current.degreeSlug)}${search}`,
    { status: 301 }
  )
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { facultySlug, degreeSlug } = params
  const db = database()

  // Find the faculty by slug
  const faculty = await db.query.faculties.findFirst({
    where: (faculties, { eq }) => eq(faculties.slug, facultySlug)
  })

  if (!faculty) {
    await redirectRenamedDegree(request, facultySlug, degreeSlug)
    throw new Response('Faculty not found', { status: 404 })
  }

  // Find the degree by slug within the faculty
  const degree = await db.query.degrees.findFirst({
    where: (degrees, { eq, and }) =>
      and(eq(degrees.slug, degreeSlug), eq(degrees.facultyId, faculty.id))
  })

  if (!degree) {
    await redirectRenamedDegree(request, facultySlug, degreeSlug)
    throw new Response('Degree not found', { status: 404 })
  }

  // Get courses with pre-computed stats from courseStats table
  const coursesWithFeedback = await db
    .select({
      id: schema.courses.id,
      name: schema.courses.name,
      acronym: schema.courses.acronym,
      url: schema.courses.url,
      offerings: offeringsSubquery(),
      hasMandatoryExam: schema.courses.hasMandatoryExam,
      isMandatory: schema.courses.isMandatory,
      lastTaughtYear: schema.courses.lastTaughtYear,
      averageRating:
        sql<number>`coalesce(${schema.courseStats.averageRating}, 0)`.as(
          'average_rating'
        ),
      averageWorkload:
        sql<number>`coalesce(${schema.courseStats.averageWorkload}, 0)`.as(
          'average_workload'
        ),
      totalFeedbackCount:
        sql<number>`coalesce(${schema.courseStats.totalFeedbackCount}, 0)`.as(
          'total_feedback_count'
        )
    })
    .from(schema.courses)
    .leftJoin(
      schema.courseStats,
      eq(schema.courseStats.courseId, schema.courses.id)
    )
    .where(eq(schema.courses.degreeId, degree.id))

  // Every term the faculty defines, not just the ones this degree's offerings
  // happen to use. Grouping resolves a period to its parent semester even when
  // no course is offered in that semester directly (LEIC's 3rd year has P1/P2
  // offerings but no S1 one), and the parent's name and ticks exist only here.
  const academicTerms = await db
    .select({
      id: schema.academicTerms.id,
      name: schema.academicTerms.name,
      startTick: schema.academicTerms.startTick,
      endTick: schema.academicTerms.endTick,
      parentId: schema.academicTerms.parentId
    })
    .from(schema.academicTerms)
    .where(eq(schema.academicTerms.facultyId, faculty.id))

  // Get course groups
  const courseGroups = await db
    .select({
      id: schema.courseGroup.id,
      name: schema.courseGroup.name,
      courseIds: sql<string>`(
        SELECT string_agg(course_id::text, ',')
        FROM mtm_course_groups__courses
        WHERE course_group_id = course_groups.id
      )`.as('course_ids')
    })
    .from(schema.courseGroup)
    .where(eq(schema.courseGroup.degreeId, degree.id))

  // Format course groups with proper courseIds array
  const formattedCourseGroups = courseGroups.map((group) => ({
    ...group,
    courseIds: group.courseIds ? group.courseIds.split(',').map(Number) : []
  }))

  // Our own description, in the page's language, once reviewed. Pages in a
  // language with no reviewed text show no "about" section.
  const detailsQuery = db
    .select({ description: schema.degreeDetails.description })
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

  const [[details], extras] = await Promise.all([
    detailsQuery,
    loadDegreePageExtras(degree.id, faculty.universityId)
  ])

  return {
    faculty,
    degree,
    about: details?.description ?? null,
    courses: coursesWithFeedback,
    academicTerms,
    courseGroups: formattedCourseGroups,
    extras,
    origin: getRequestOrigin(request)
  }
}

export default function DegreePage({ loaderData }: Route.ComponentProps) {
  const location = useLocation()
  // Persist selection when component mounts
  useEffect(() => {
    if (loaderData.faculty?.slug && loaderData.degree?.slug) {
      userPreferences.set({
        lastSelectedFacultySlug: loaderData.faculty.slug,
        lastSelectedDegreeSlug: loaderData.degree.slug,
        lastVisitedPath: location.pathname
      })
    }
  }, [loaderData.faculty?.slug, loaderData.degree?.slug, location.pathname])

  return (
    <DegreePageContent
      faculty={loaderData.faculty}
      degree={loaderData.degree}
      about={loaderData.about}
      courses={loaderData.courses}
      academicTerms={loaderData.academicTerms}
      courseGroups={loaderData.courseGroups}
      extras={loaderData.extras}
    />
  )
}
