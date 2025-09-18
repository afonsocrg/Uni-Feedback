import { database } from '@uni-feedback/db'
import { and, eq, sql } from 'drizzle-orm'
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

  // First, find the faculty by short name
  const faculty = await db.query.faculties.findFirst({
    where: (faculties, { eq }) => eq(faculties.shortName, facultyShortName)
  })

  if (!faculty) {
    throw new Response('Faculty not found', { status: 404 })
  }

  // Get degrees with counts using similar logic to the API
  const degreesWithCounts = await db
    .select({
      id: db.schema.degrees.id,
      externalId: db.schema.degrees.externalId,
      type: db.schema.degrees.type,
      name: db.schema.degrees.name,
      acronym: db.schema.degrees.acronym,
      courseCount: sql<number>`ifnull(count(distinct ${db.schema.courses.id}), 0)`.as(
        'course_count'
      ),
      feedbackCount: sql<number>`ifnull(count(distinct ${db.schema.feedback.id}), 0)`.as(
        'feedback_count'
      )
    })
    .from(db.schema.degrees)
    .leftJoin(db.schema.courses, eq(db.schema.courses.degreeId, db.schema.degrees.id))
    .leftJoin(
      db.schema.feedback,
      and(
        eq(db.schema.feedback.courseId, db.schema.courses.id),
        eq(db.schema.feedback.isActive, true)
      )
    )
    .where(eq(db.schema.degrees.facultyId, faculty.id))
    .groupBy(db.schema.degrees.id)
    .having(sql`count(distinct ${db.schema.courses.id}) > 0`)

  return {
    faculty,
    degrees: degreesWithCounts
  }
}

export default function FacultyPage({ loaderData }: Route.ComponentProps) {
  return <FacultyPageContent faculty={loaderData.faculty} degrees={loaderData.degrees} />
}