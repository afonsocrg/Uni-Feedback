import { database, schema } from '@uni-feedback/db'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { and, desc, eq, isNotNull, ne, sql } from 'drizzle-orm'
import { TeacherProfileContent } from '~/components'
import { getCurrentUserId } from '~/lib/auth.server'

import type { Route } from './+types/teachers.$teacherId'

const TEACHER_FEEDBACK_PAGE_SIZE = 10

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData?.teacher) {
    return [
      { title: 'Teacher Not Found - Uni Feedback' },
      { name: 'description', content: 'The requested teacher was not found.' }
    ]
  }

  return [
    { title: `${loaderData.teacher.name} - Uni Feedback` },
    {
      name: 'description',
      content: `Teacher profile for ${loaderData.teacher.name}`
    }
  ]
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const teacherId = parseInt(params.teacherId, 10)
  const url = new URL(request.url)
  const feedbackOffset = Math.max(
    Number(url.searchParams.get('feedbackOffset') ?? 0) || 0,
    0
  )

  if (isNaN(teacherId)) {
    throw new Response('Invalid teacher ID', { status: 400 })
  }

  const db = database()
  const currentUserId = await getCurrentUserId(request)

  const teacher = await db.query.teachers.findFirst({
    where: (teachers, { eq }) => eq(teachers.id, teacherId)
  })

  if (!teacher) {
    throw new Response('Teacher not found', { status: 404 })
  }

  const currentSchoolYear = getCurrentSchoolYear()

  const taughtCourses = await db
    .select({
      id: schema.courses.id,
      name: schema.courses.name,
      acronym: schema.courses.acronym,
      degreeName: schema.degrees.name,
      degreeAcronym: schema.degrees.acronym,
      taughtSchoolYears: sql<
        number[]
      >`array_agg(distinct ${schema.courseTeacherAssignments.schoolYear} order by ${schema.courseTeacherAssignments.schoolYear} desc)`.as(
        'taught_school_years'
      ),
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
    .from(schema.courseTeacherAssignments)
    .innerJoin(
      schema.courses,
      eq(schema.courseTeacherAssignments.courseId, schema.courses.id)
    )
    .leftJoin(schema.degrees, eq(schema.courses.degreeId, schema.degrees.id))
    .leftJoin(
      schema.courseStats,
      eq(schema.courseStats.courseId, schema.courses.id)
    )
    .where(eq(schema.courseTeacherAssignments.teacherId, teacherId))
    .groupBy(
      schema.courses.id,
      schema.courses.name,
      schema.courses.acronym,
      schema.degrees.name,
      schema.degrees.acronym,
      schema.courseStats.averageRating,
      schema.courseStats.averageWorkload,
      schema.courseStats.totalFeedbackCount
    )
    .orderBy(schema.courses.name)

  const currentCourses = taughtCourses.filter((course) =>
    course.taughtSchoolYears.includes(currentSchoolYear)
  )
  const pastCourses = taughtCourses.filter(
    (course) => !course.taughtSchoolYears.includes(currentSchoolYear)
  )

  const relevantFeedbackRows = await db
    .select({
      id: schema.feedback.id,
      courseId: schema.feedback.courseId,
      schoolYear: schema.feedback.schoolYear,
      rating: schema.feedback.rating,
      workloadRating: schema.feedback.workloadRating,
      comment: schema.feedback.comment,
      createdAt: schema.feedback.createdAt,
      course: {
        id: schema.courses.id,
        name: schema.courses.name,
        acronym: schema.courses.acronym
      },
      degree: {
        id: schema.degrees.id,
        name: schema.degrees.name,
        acronym: schema.degrees.acronym
      },
      isFromDifferentCourse: sql<number>`0`.as('is_from_different_course'),
      helpfulVoteCount:
        sql<number>`(SELECT COUNT(*) FROM helpful_votes WHERE feedback_id = ${schema.feedback.id})::integer`.as(
          'helpful_vote_count'
        ),
      hasVoted: currentUserId
        ? sql<boolean>`EXISTS (SELECT 1 FROM helpful_votes WHERE feedback_id = ${schema.feedback.id} AND user_id = ${currentUserId})`.as(
            'has_voted'
          )
        : sql<boolean>`false`.as('has_voted')
    })
    .from(schema.feedback)
    .innerJoin(
      schema.courseTeacherAssignments,
      and(
        eq(schema.courseTeacherAssignments.courseId, schema.feedback.courseId),
        eq(schema.courseTeacherAssignments.teacherId, teacherId),
        eq(
          schema.courseTeacherAssignments.schoolYear,
          schema.feedback.schoolYear
        )
      )
    )
    .innerJoin(schema.courses, eq(schema.feedback.courseId, schema.courses.id))
    .innerJoin(schema.degrees, eq(schema.courses.degreeId, schema.degrees.id))
    .where(
      and(
        isNotNull(schema.feedback.approvedAt),
        isNotNull(schema.feedback.comment),
        ne(schema.feedback.comment, '')
      )
    )
    .orderBy(desc(schema.feedback.createdAt))
    .limit(TEACHER_FEEDBACK_PAGE_SIZE + 1)
    .offset(feedbackOffset)

  const relevantFeedback = relevantFeedbackRows.slice(
    0,
    TEACHER_FEEDBACK_PAGE_SIZE
  )

  return {
    teacher,
    currentCourses,
    pastCourses,
    relevantFeedback,
    relevantFeedbackHasMore:
      relevantFeedbackRows.length > TEACHER_FEEDBACK_PAGE_SIZE,
    relevantFeedbackOffset: feedbackOffset,
    relevantFeedbackLimit: TEACHER_FEEDBACK_PAGE_SIZE
  }
}

export default function TeacherProfilePage({
  loaderData
}: Route.ComponentProps) {
  return (
    <TeacherProfileContent
      teacher={loaderData.teacher}
      currentCourses={loaderData.currentCourses}
      pastCourses={loaderData.pastCourses}
      relevantFeedback={loaderData.relevantFeedback}
      relevantFeedbackHasMore={loaderData.relevantFeedbackHasMore}
      relevantFeedbackOffset={loaderData.relevantFeedbackOffset}
      relevantFeedbackLimit={loaderData.relevantFeedbackLimit}
    />
  )
}
