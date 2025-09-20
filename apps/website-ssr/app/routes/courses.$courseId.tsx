import { database, schema } from '@uni-feedback/db'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { CourseDetailContent } from '~/components'

import type { Route } from './+types/courses.$courseId'

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData.course) {
    return [
      { title: 'Course Not Found - Uni Feedback' },
      { name: 'description', content: 'The requested course was not found.' }
    ]
  }

  const { course } = loaderData

  return [
    {
      title: `Uni Feedback - ${course.acronym}`
    },
    {
      name: 'description',
      content: `Read honest, anonymous student reviews for ${course.name} (${course.acronym}). Get insights on workload, assessment, and course content to help you make informed decisions.`
    }
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
  const { courseId } = params
  const courseIdNum = parseInt(courseId, 10)

  if (isNaN(courseIdNum)) {
    throw new Response('Invalid course ID', { status: 400 })
  }

  const db = database()

  // Get course details
  const course = await db.query.courses.findFirst({
    where: (courses, { eq }) => eq(courses.id, courseIdNum)
  })

  if (!course) {
    throw new Response('Course not found', { status: 404 })
  }

  // Get feedback aggregation separately
  const feedbackAggregation = await db
    .select({
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
    .from(schema.feedback)
    .where(
      and(
        eq(schema.feedback.courseId, courseIdNum),
        isNotNull(schema.feedback.approvedAt)
      )
    )

  const aggregation = feedbackAggregation[0] || {
    averageRating: 0,
    averageWorkload: 0,
    totalFeedbackCount: 0
  }

  // Get degree information
  let degree = null
  if (course.degreeId) {
    degree = await db.query.degrees.findFirst({
      where: (degrees, { eq }) => eq(degrees.id, course.degreeId)
    })
  }

  // Get faculty information if degree exists
  let faculty = null
  if (degree?.facultyId) {
    faculty = await db.query.faculties.findFirst({
      where: (faculties, { eq }) => eq(faculties.id, degree.facultyId)
    })
  }

  // Get feedback for the course
  const feedback = await db
    .select({
      id: schema.feedback.id,
      courseId: schema.feedback.courseId,
      email: schema.feedback.email,
      schoolYear: schema.feedback.schoolYear,
      rating: schema.feedback.rating,
      workloadRating: schema.feedback.workloadRating,
      comment: schema.feedback.comment,
      createdAt: schema.feedback.createdAt
    })
    .from(schema.feedback)
    .where(
      and(
        eq(schema.feedback.courseId, courseIdNum),
        isNotNull(schema.feedback.approvedAt)
      )
    )
    .orderBy(sql`${schema.feedback.createdAt} DESC`)

  return {
    course: {
      ...course,
      ...aggregation,
      degree,
      faculty
    },
    feedback
  }
}

export default function CourseDetailPage({ loaderData }: Route.ComponentProps) {
  return (
    <CourseDetailContent
      course={loaderData.course}
      feedback={loaderData.feedback}
    />
  )
}
