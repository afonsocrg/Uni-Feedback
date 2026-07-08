import { database, queries, schema } from '@uni-feedback/db'
import { desc, eq, sql } from 'drizzle-orm'
import { CourseDetailContent } from '~/components'
import { getCurrentUserId } from '~/lib/auth.server'
import { getCoursePath } from '~/utils/i18n-routes'
import { buildMeta } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/courses.$courseId'

export function meta({ loaderData, matches }: Route.MetaArgs) {
  if (!loaderData.course) {
    return buildMeta({
      matches,
      title: 'Course Not Found - Uni Feedback',
      description: 'The requested course was not found.'
    })
  }

  const { course, feedback, origin } = loaderData

  // Build a more descriptive title with context
  const titleParts = [course.name]
  if (course.acronym) {
    titleParts.push(`(${course.acronym})`)
  }
  if (course.degree) {
    titleParts.push(`- ${course.degree.name}`)
  }
  if (course.faculty) {
    titleParts.push(`- ${course.faculty.name}`)
  }
  titleParts.push('- Uni Feedback')

  const title = titleParts.join(' ')

  // Build a more informative description
  let description = `Read honest, anonymous student reviews for ${course.name} (${course.acronym})`

  if (course.degree) {
    description += ` from the ${course.degree.name}`
  }

  if (course.faculty) {
    description += ` at ${course.faculty.name}`
  }

  if (course.totalFeedbackCount > 0) {
    description += `. Average rating: ${Number(course.averageRating).toFixed(1)}/5 based on ${course.totalFeedbackCount} student review${course.totalFeedbackCount === 1 ? '' : 's'}`
  }

  description +=
    '. Get insights on workload, assessment, and course content to help you make informed decisions.'

  // Build Schema.org structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    url: `${origin}${getCoursePath('pt', course.id)}`,
    name: course.name,
    courseCode: course.acronym,
    numberOfCredits: course.ects,
    ...(course.description && { description: course.description }),
    ...(course.faculty && {
      provider: {
        '@type': 'CollegeOrUniversity',
        name: course.faculty.name
      }
    }),
    ...(course.totalFeedbackCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(course.averageRating).toFixed(1),
        reviewCount: course.totalFeedbackCount.toString(),
        bestRating: '5',
        worstRating: '1'
      }
    }),
    ...(feedback.length > 0 && {
      review: feedback.map((f) => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: f.rating.toString(),
          bestRating: '5',
          worstRating: '1'
        },
        author: {
          '@type': 'Person',
          name: 'Anonymous Student'
        },
        ...(f.comment && { reviewBody: f.comment }),
        datePublished: f.createdAt
          ? new Date(f.createdAt).toISOString().split('T')[0]
          : undefined
      }))
    })
  }

  return buildMeta({
    matches,
    title,
    description,
    url: `${origin}${getCoursePath('pt', course.id)}`,
    keywords: [
      course.name,
      course.acronym,
      course.degree?.name,
      course.faculty?.name,
      'course reviews',
      'student feedback',
      'university reviews',
      'course ratings'
    ].filter((k): k is string => Boolean(k)),
    structuredData
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { courseId } = params
  const courseIdNum = parseInt(courseId, 10)

  if (isNaN(courseIdNum)) {
    throw new Response('Invalid course ID', { status: 400 })
  }

  const db = database()

  // Get current user ID (if logged in)
  const currentUserId = await getCurrentUserId(request)

  // Get course details
  const course = await db.query.courses.findFirst({
    where: (courses, { eq }) => eq(courses.id, courseIdNum),
    with: { offerings: { with: { academicTerm: true } } }
  })

  if (!course) {
    throw new Response('Course not found', { status: 404 })
  }

  // Get feedback aggregation separately (includes feedback from identical courses)
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
    .where(queries.getFeedbackWhereCondition(courseIdNum))

  const aggregation = feedbackAggregation[0] || {
    averageRating: 0,
    averageWorkload: 0,
    totalFeedbackCount: 0
  }

  // Get degree information
  let degree = null
  if (course.degreeId) {
    const degreeId = course.degreeId
    degree = await db.query.degrees.findFirst({
      where: (degrees, { eq }) => eq(degrees.id, degreeId)
    })
  }

  // Get faculty information if degree exists
  let faculty = null
  if (degree?.facultyId) {
    const facultyId = degree.facultyId
    faculty = await db.query.faculties.findFirst({
      where: (faculties, { eq }) => eq(faculties.id, facultyId)
    })
  }

  // Get teachers for the course
  const teachers = await db
    .select({
      id: schema.teachers.id,
      name: schema.teachers.name,
      email: schema.teachers.email,
      taughtSchoolYears: sql<
        number[]
      >`array_agg(distinct ${schema.courseTeacherAssignments.schoolYear} order by ${schema.courseTeacherAssignments.schoolYear} desc)`.as(
        'taught_school_years'
      )
    })
    .from(schema.courseTeacherAssignments)
    .innerJoin(
      schema.teachers,
      eq(schema.courseTeacherAssignments.teacherId, schema.teachers.id)
    )
    .where(eq(schema.courseTeacherAssignments.courseId, courseIdNum))
    .groupBy(schema.teachers.id, schema.teachers.name, schema.teachers.email)
    .orderBy(
      sql`max(${schema.courseTeacherAssignments.schoolYear}) desc`,
      schema.teachers.name
    )

  // Get feedback for the course (includes feedback from identical courses)
  const feedback = await db
    .select({
      id: schema.feedback.id,
      courseId: schema.feedback.courseId,
      email: schema.feedback.email,
      schoolYear: schema.feedback.schoolYear,
      rating: schema.feedback.rating,
      workloadRating: schema.feedback.workloadRating,
      comment: schema.feedback.comment,
      createdAt: schema.feedback.createdAt,
      updatedAt: schema.feedback.updatedAt,
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
      isFromDifferentCourse:
        sql<number>`${schema.feedback.courseId} != ${courseIdNum}`.as(
          'is_from_different_course'
        ),
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
    .innerJoin(schema.courses, eq(schema.feedback.courseId, schema.courses.id))
    .innerJoin(schema.degrees, eq(schema.courses.degreeId, schema.degrees.id))
    .where(queries.getFeedbackWhereCondition(courseIdNum))
    .orderBy(desc(schema.feedback.createdAt))

  return {
    course: {
      ...course,
      offerings: course.offerings.map((o) => ({
        curriculumYear: o.curriculumYear,
        academicTerm: {
          name: o.academicTerm.name,
          startTick: o.academicTerm.startTick,
          endTick: o.academicTerm.endTick
        }
      })),
      ...aggregation,
      degree,
      faculty,
      teachers
    },
    feedback,
    origin: getRequestOrigin(request)
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
