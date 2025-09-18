import { database, schema } from '@uni-feedback/db'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { FacultyPageContent } from '../components'

import type { Route } from './+types/$facultyShortName'

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData.faculty) {
    return [
      { title: 'Faculty Not Found - Uni Feedback' },
      { name: 'description', content: 'The requested faculty was not found.' }
    ]
  }

  return [
    { title: `${loaderData.faculty.name} - Uni Feedback` },
    {
      name: 'description',
      content: `Browse degrees and courses from ${loaderData.faculty.name}. Read honest, anonymous student reviews to help you choose the right courses.`
    }
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
  const { facultyShortName } = params
  const db = database()

  // Find the faculty by slug
  const faculty = await db.query.faculties.findFirst({
    where: (faculties, { eq }) => eq(faculties.slug, facultyShortName)
  })

  if (!faculty) {
    throw new Response('Faculty not found', { status: 404 })
  }

  // Get degrees with counts using similar logic to the API
  const degreesWithCounts = await db
    .select({
      id: schema.degrees.id,
      externalId: schema.degrees.externalId,
      type: schema.degrees.type,
      name: schema.degrees.name,
      acronym: schema.degrees.acronym,
      courseCount:
        sql<number>`coalesce(count(distinct ${schema.courses.id}), 0)`.as(
          'course_count'
        ),
      feedbackCount:
        sql<number>`coalesce(count(distinct ${schema.feedback.id}), 0)`.as(
          'feedback_count'
        )
    })
    .from(schema.degrees)
    .leftJoin(schema.courses, eq(schema.courses.degreeId, schema.degrees.id))
    .leftJoin(
      schema.feedback,
      and(
        eq(schema.feedback.courseId, schema.courses.id),
        isNotNull(schema.feedback.approvedAt)
      )
    )
    .where(eq(schema.degrees.facultyId, faculty.id))
    .groupBy(schema.degrees.id)
    .having(sql`count(distinct ${schema.courses.id}) > 0`)

  return {
    faculty,
    degrees: degreesWithCounts
  }
}

export default function FacultyPage({ loaderData }: Route.ComponentProps) {
  return (
    <FacultyPageContent
      faculty={loaderData.faculty}
      degrees={loaderData.degrees}
    />
  )
}
