import { database, offeringsSubquery, schema } from '@uni-feedback/db'
import { eq, sql } from 'drizzle-orm'
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { DegreePageContent } from '~/components'
import { userPreferences } from '~/utils'

import { getCoursePath, getDegreePath } from '~/utils/i18n-routes'
import { buildMeta } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/$facultySlug.$degreeSlug'

export function meta({ loaderData, matches }: Route.MetaArgs) {
  if (!loaderData.faculty || !loaderData.degree) {
    return buildMeta({
      matches,
      title: 'Page Not Found - Uni Feedback',
      description: 'The requested page was not found.'
    })
  }

  const { faculty, degree, courses, origin } = loaderData

  // Build title
  const title = `${degree.name} (${degree.acronym}) - ${faculty.shortName} - Course Feedback - Uni Feedback`

  // Build description with stats
  const totalFeedback = courses.reduce(
    (sum, c) => sum + Number(c.totalFeedbackCount),
    0
  )
  const coursesWithReviews = courses.filter(
    (c) => Number(c.totalFeedbackCount) > 0
  ).length

  let description = `Browse ${courses.length} course${courses.length !== 1 ? 's' : ''} from ${degree.name} at ${faculty.name}`

  if (totalFeedback > 0) {
    description += ` with ${totalFeedback} student review${totalFeedback !== 1 ? 's' : ''} across ${coursesWithReviews} course${coursesWithReviews !== 1 ? 's' : ''}`
  }

  description +=
    '. Read honest, anonymous feedback to help you choose the right courses.'

  // Add top courses to description
  const topCourses = courses
    .filter((c) => Number(c.totalFeedbackCount) > 0)
    .sort((a, b) => Number(b.totalFeedbackCount) - Number(a.totalFeedbackCount))
    .slice(0, 3)
    .map((c) => c.acronym)
    .join(', ')

  if (topCourses) {
    description += ` Popular courses: ${topCourses}.`
  }

  // Schema.org structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: degree.name,
    alternateName: degree.acronym,
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: faculty.name,
      alternateName: faculty.shortName
    },
    ...(faculty.slug &&
      degree.slug && {
        url: `${origin}${getDegreePath('pt', faculty.slug, degree.slug)}`
      }),
    ...(courses.length > 0 && {
      offers: {
        '@type': 'ItemList',
        numberOfItems: courses.length,
        itemListElement: courses.map((course, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Course',
            name: course.name,
            courseCode: course.acronym,
            url: `${origin}${getCoursePath('pt', course.id)}`,
            ...(Number(course.totalFeedbackCount) > 0 && {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(course.averageRating).toFixed(1),
                reviewCount: course.totalFeedbackCount.toString(),
                bestRating: '5',
                worstRating: '1'
              }
            })
          }
        }))
      }
    })
  }

  return buildMeta({
    matches,
    title,
    description,
    url:
      faculty.slug && degree.slug
        ? `${origin}${getDegreePath('pt', faculty.slug, degree.slug)}`
        : undefined,
    keywords: [
      degree.name,
      degree.acronym,
      faculty.name,
      faculty.shortName,
      'course reviews',
      'student feedback',
      'university courses',
      ...courses.map((c) => c.name),
      ...courses.map((c) => c.acronym)
    ].filter((k): k is string => Boolean(k)),
    structuredData
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { facultySlug, degreeSlug } = params
  const db = database()

  // Find the faculty by slug
  const faculty = await db.query.faculties.findFirst({
    where: (faculties, { eq }) => eq(faculties.slug, facultySlug)
  })

  if (!faculty) {
    throw new Response('Faculty not found', { status: 404 })
  }

  // Find the degree by slug within the faculty
  const degree = await db.query.degrees.findFirst({
    where: (degrees, { eq, and }) =>
      and(eq(degrees.slug, degreeSlug), eq(degrees.facultyId, faculty.id))
  })

  if (!degree) {
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

  return {
    faculty,
    degree,
    courses: coursesWithFeedback,
    courseGroups: formattedCourseGroups,
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
      courses={loaderData.courses}
      courseGroups={loaderData.courseGroups}
    />
  )
}
