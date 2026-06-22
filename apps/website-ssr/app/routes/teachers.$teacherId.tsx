import { database, schema } from '@uni-feedback/db'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { and, desc, eq, isNotNull, isNull, ne, or, sql } from 'drizzle-orm'
import { TeacherProfileContent } from '~/components'
import { getCurrentUserId } from '~/lib/auth.server'

import type { Route } from './+types/teachers.$teacherId'

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData?.teacher) {
    return [
      { title: 'Professor Not Found - Uni Feedback' },
      { name: 'description', content: 'The requested professor was not found.' }
    ]
  }

  return [
    { title: `${loaderData.teacher.name} - Uni Feedback` },
    {
      name: 'description',
      content: `Professor profile for ${loaderData.teacher.name}`
    }
  ]
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const teacherId = parseInt(params.teacherId, 10)

  if (isNaN(teacherId)) {
    throw new Response('Invalid professor ID', { status: 400 })
  }

  const db = database()
  const currentUserId = await getCurrentUserId(request)

  const teacher = await db.query.teachers.findFirst({
    where: (teachers, { eq }) => eq(teachers.id, teacherId)
  })

  if (!teacher) {
    throw new Response('Professor not found', { status: 404 })
  }

  const currentSchoolYear = formatSchoolYearString(getCurrentSchoolYear(), {
    yearFormat: 'long'
  })

  const taughtCourses = await db
    .select({
      id: schema.courses.id,
      name: schema.courses.name,
      acronym: schema.courses.acronym,
      degreeName: schema.degrees.name,
      degreeAcronym: schema.degrees.acronym,
      latestSchoolYear: schema.coursesTeachers.latestSchoolYear,
      latestSemester: schema.coursesTeachers.latestSemester,
      latestExecutionLabel: schema.coursesTeachers.latestExecutionLabel,
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
    .from(schema.coursesTeachers)
    .innerJoin(
      schema.courses,
      eq(schema.coursesTeachers.courseId, schema.courses.id)
    )
    .leftJoin(schema.degrees, eq(schema.courses.degreeId, schema.degrees.id))
    .leftJoin(
      schema.courseStats,
      eq(schema.courseStats.courseId, schema.courses.id)
    )
    .where(eq(schema.coursesTeachers.teacherId, teacherId))
    .orderBy(
      sql`${schema.coursesTeachers.latestSchoolYear} desc nulls last`,
      desc(schema.coursesTeachers.latestSemester),
      schema.courses.name
    )

  const currentCourses = taughtCourses.filter(
    (course) => course.latestSchoolYear === currentSchoolYear
  )
  const pastCourses = taughtCourses.filter(
    (course) => course.latestSchoolYear !== currentSchoolYear
  )

  const relevantFeedback = await db
    .select({
      id: schema.feedbackFull.id,
      courseId: schema.feedbackFull.courseId,
      schoolYear: schema.feedbackFull.schoolYear,
      rating: schema.feedbackFull.rating,
      workloadRating: schema.feedbackFull.workloadRating,
      comment: schema.feedbackFull.comment,
      createdAt: schema.feedbackFull.createdAt,
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
        sql<number>`(SELECT COUNT(*) FROM helpful_votes WHERE feedback_id = ${schema.feedbackFull.id})::integer`.as(
          'helpful_vote_count'
        ),
      hasVoted: currentUserId
        ? sql<boolean>`EXISTS (SELECT 1 FROM helpful_votes WHERE feedback_id = ${schema.feedbackFull.id} AND user_id = ${currentUserId})`.as(
            'has_voted'
          )
        : sql<boolean>`false`.as('has_voted')
    })
    .from(schema.feedbackFull)
    .innerJoin(
      schema.coursesTeachers,
      and(
        eq(schema.coursesTeachers.courseId, schema.feedbackFull.courseId),
        eq(schema.coursesTeachers.teacherId, teacherId)
      )
    )
    .innerJoin(
      schema.courses,
      eq(schema.feedbackFull.courseId, schema.courses.id)
    )
    .innerJoin(schema.degrees, eq(schema.courses.degreeId, schema.degrees.id))
    .leftJoin(
      schema.feedbackTeachers,
      and(
        eq(schema.feedbackTeachers.feedbackId, schema.feedbackFull.id),
        eq(schema.feedbackTeachers.teacherId, teacherId)
      )
    )
    .where(
      and(
        isNull(schema.feedbackFull.deletedAt),
        isNotNull(schema.feedbackFull.approvedAt),
        isNotNull(schema.feedbackFull.comment),
        ne(schema.feedbackFull.comment, ''),
        or(
          eq(schema.feedbackFull.mentionsTeachingStaff, true),
          isNotNull(schema.feedbackTeachers.teacherId)
        )
      )
    )
    .orderBy(desc(schema.feedbackFull.createdAt))

  return { teacher, currentCourses, pastCourses, relevantFeedback }
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
    />
  )
}
