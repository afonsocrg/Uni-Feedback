import {
  database,
  findDegreeSlugRedirect,
  offeringsSubquery,
  schema
} from '@uni-feedback/db'
import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { eq, sql } from 'drizzle-orm'
import { redirect } from 'react-router'
import type { Lang } from '~/i18n/config'
import { detectLang } from '~/utils/i18n-routes'

/**
 * What the degree page and the degree's course browser (`/cadeiras`) both
 * load: the faculty and degree by slug (with the renamed-slug 301), and the
 * degree's courses with their stats, offerings and terms.
 */

type PathFor = (lang: Lang, facultySlug: string, degreeSlug: string) => string

/**
 * The faculty and degree for these slugs. A renamed faculty or degree slug (or
 * both) answers a 301 to the current URL built by `pathFor`, keeping the
 * language and the query string; an unknown one is a 404.
 */
export async function findDegreeBySlugs(
  request: Request,
  facultySlug: string,
  degreeSlug: string,
  pathFor: PathFor
): Promise<{ faculty: Faculty; degree: Degree }> {
  const db = database()

  const redirectIfRenamed = async () => {
    const current = await findDegreeSlugRedirect(facultySlug, degreeSlug)
    if (!current) return
    const { pathname, search } = new URL(request.url)
    throw redirect(
      `${pathFor(detectLang(pathname), current.facultySlug, current.degreeSlug)}${search}`,
      { status: 301 }
    )
  }

  const faculty = await db.query.faculties.findFirst({
    where: (faculties, { eq }) => eq(faculties.slug, facultySlug)
  })
  if (!faculty) {
    await redirectIfRenamed()
    throw new Response('Faculty not found', { status: 404 })
  }

  const degree = await db.query.degrees.findFirst({
    where: (degrees, { eq, and }) =>
      and(eq(degrees.slug, degreeSlug), eq(degrees.facultyId, faculty.id))
  })
  if (!degree) {
    await redirectIfRenamed()
    throw new Response('Degree not found', { status: 404 })
  }

  return { faculty, degree }
}

/** The degree's courses with pre-computed stats (course_stats) and offerings. */
export function loadDegreeCourses(degreeId: number) {
  const db = database()
  return db
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
    .where(eq(schema.courses.degreeId, degreeId))
}

/**
 * Every term the faculty defines, not just the ones this degree's offerings
 * happen to use. Grouping resolves a period to its parent semester even when no
 * course is offered in that semester directly (LEIC's 3rd year has P1/P2
 * offerings but no S1 one), and the parent's name and ticks exist only here.
 */
export function loadAcademicTerms(facultyId: number) {
  const db = database()
  return db
    .select({
      id: schema.academicTerms.id,
      name: schema.academicTerms.name,
      startTick: schema.academicTerms.startTick,
      endTick: schema.academicTerms.endTick,
      parentId: schema.academicTerms.parentId
    })
    .from(schema.academicTerms)
    .where(eq(schema.academicTerms.facultyId, facultyId))
}

/** The degree's course groups, each with the ids of its courses. */
export async function loadCourseGroups(degreeId: number) {
  const db = database()
  const groups = await db
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
    .where(eq(schema.courseGroup.degreeId, degreeId))
  return groups.map((group) => ({
    ...group,
    courseIds: group.courseIds ? group.courseIds.split(',').map(Number) : []
  }))
}
