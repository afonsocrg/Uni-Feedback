import { database, schema } from '@uni-feedback/db'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { DegreePageContent } from '../components'

import type { Route } from './+types/$facultySlug.$degreeSlug'

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData.faculty || !loaderData.degree) {
    return [
      { title: 'Page Not Found - Uni Feedback' },
      { name: 'description', content: 'The requested page was not found.' }
    ]
  }

  return [
    {
      title: `Uni Feedback - ${loaderData.degree.acronym}`
    },
    {
      name: 'description',
      content: `Browse courses from ${loaderData.degree.name} at ${loaderData.faculty.name}. Read honest, anonymous student reviews to help you choose the right courses.`
    }
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
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

  // Get courses with feedback aggregation
  const coursesWithFeedback = await db
    .select({
      id: schema.courses.id,
      name: schema.courses.name,
      acronym: schema.courses.acronym,
      url: schema.courses.url,
      terms: schema.courses.terms,
      hasMandatoryExam: schema.courses.hasMandatoryExam,
      averageRating:
        sql<number>`coalesce(avg(${schema.feedback.rating})::numeric, 0)`.as(
          'average_rating'
        ),
      averageWorkload:
        sql<number>`coalesce(avg(${schema.feedback.workloadRating})::numeric, 0)`.as(
          'average_workload'
        ),
      totalFeedbackCount:
        sql<number>`coalesce(count(distinct ${schema.feedback.id})::integer, 0)`.as(
          'total_feedback_count'
        )
    })
    .from(schema.courses)
    .leftJoin(
      schema.feedback,
      and(
        eq(schema.feedback.courseId, schema.courses.id),
        isNotNull(schema.feedback.approvedAt)
      )
    )
    .where(eq(schema.courses.degreeId, degree.id))
    .groupBy(schema.courses.id)

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
    courseGroups: formattedCourseGroups
  }
}

export default function DegreePage({ loaderData }: Route.ComponentProps) {
  return (
    <DegreePageContent
      faculty={loaderData.faculty}
      degree={loaderData.degree}
      courses={loaderData.courses}
      courseGroups={loaderData.courseGroups}
    />
  )
}
