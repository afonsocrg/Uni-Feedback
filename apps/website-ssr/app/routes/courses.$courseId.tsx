import { database, queries, schema } from '@uni-feedback/db'
import { type AnyColumn, and, desc, eq, sql } from 'drizzle-orm'
import { CourseDetailContent } from '~/components'
import { getCurrentUserId } from '~/lib/auth.server'
import { loadCrumbUniversity } from '~/lib/crumbUniversity.server'
import { breadcrumbJsonLd, buildCrumbs } from '~/utils/breadcrumbs'
import { isCourseIndexable } from '~/utils/course'
import { detectLang, getCoursePath } from '~/utils/i18n-routes'
import {
  type ContentLang,
  type Localized,
  pickName,
  pickTextEither
} from '~/utils/localizedContent'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/courses.$courseId'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'course')
  const lang = detectLang(location.pathname)

  if (!loaderData.course) {
    return buildMeta({
      matches,
      title: t('meta.not_found_title'),
      description: t('meta.not_found_desc')
    })
  }

  const { course, feedback, origin } = loaderData

  // Titles get cut around 60 characters, so lead with what people search for
  // (course name and acronym, then the school) and leave the degree out: the
  // same course is often shared by several degrees anyway.
  const courseLabel = course.acronym
    ? `${course.name} (${course.acronym})`
    : course.name
  const subject = course.faculty
    ? `${courseLabel}, ${course.faculty.shortName}`
    : courseLabel

  const title = t('meta.title', { subject })
  const description =
    course.totalFeedbackCount > 0
      ? t('meta.description_reviews', {
          subject,
          count: course.totalFeedbackCount,
          rating: Number(course.averageRating).toFixed(1)
        })
      : t('meta.description', { subject })

  // Build Schema.org structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    url: `${origin}${getCoursePath(lang, course.id)}`,
    name: course.name,
    ...(course.alternateName && { alternateName: course.alternateName }),
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

  const breadcrumbs = breadcrumbJsonLd(
    buildCrumbs(lang, metaT(location, 'common')('breadcrumb.universities'), {
      university: course.university,
      faculty: course.faculty,
      degree: course.degree,
      courses: metaT(location, 'browse')('courses_page.breadcrumb'),
      current: course.acronym || course.name,
      currentName: course.name
    }),
    origin,
    `${origin}${getCoursePath(lang, course.id)}`
  )

  return buildMeta({
    matches,
    title,
    description,
    url: `${origin}${getCoursePath(lang, course.id)}`,
    // Same predicate the sitemap uses, so a page we don't list is also one we
    // ask crawlers not to index.
    robots: isCourseIndexable(course) ? undefined : 'noindex, follow',
    structuredData: [structuredData, breadcrumbs]
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

  // The course's name and texts in the page's language (content translation,
  // 0058). `course_details` holds the faculty's own text per language; a
  // translated row shows only once reviewed. Courses with no rows yet keep the
  // legacy columns, whose language we don't know.
  const lang = detectLang(new URL(request.url).pathname)
  const detailRows = await db
    .select()
    .from(schema.courseDetails)
    .where(
      and(
        eq(schema.courseDetails.courseId, courseIdNum),
        sql`(${schema.courseDetails.source} <> 'translation' or ${schema.courseDetails.reviewedAt} is not null)`
      )
    )
  const content = pickCourseContent(lang, detailRows, course)
  const localizedName = pickName(lang, course.name, course.nameEn)

  // Counts of feedback per rating value (1..5), as a single `filter`ed aggregate
  // so the distributions come from the same scan as the averages.
  const bucketCount = (column: AnyColumn, value: number) =>
    sql<number>`coalesce(count(*) filter (where ${column} = ${value})::integer, 0)`

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
        ),
      rating1: bucketCount(schema.feedback.rating, 1),
      rating2: bucketCount(schema.feedback.rating, 2),
      rating3: bucketCount(schema.feedback.rating, 3),
      rating4: bucketCount(schema.feedback.rating, 4),
      rating5: bucketCount(schema.feedback.rating, 5),
      workload1: bucketCount(schema.feedback.workloadRating, 1),
      workload2: bucketCount(schema.feedback.workloadRating, 2),
      workload3: bucketCount(schema.feedback.workloadRating, 3),
      workload4: bucketCount(schema.feedback.workloadRating, 4),
      workload5: bucketCount(schema.feedback.workloadRating, 5)
    })
    .from(schema.feedback)
    .where(queries.getFeedbackWhereCondition(courseIdNum))

  const row = feedbackAggregation[0]

  // Index 0 holds the count for value 1, index 4 the count for value 5.
  const aggregation = {
    averageRating: row?.averageRating ?? 0,
    averageWorkload: row?.averageWorkload ?? 0,
    totalFeedbackCount: row?.totalFeedbackCount ?? 0,
    ratingDistribution: [
      row?.rating1 ?? 0,
      row?.rating2 ?? 0,
      row?.rating3 ?? 0,
      row?.rating4 ?? 0,
      row?.rating5 ?? 0
    ],
    workloadDistribution: [
      row?.workload1 ?? 0,
      row?.workload2 ?? 0,
      row?.workload3 ?? 0,
      row?.workload4 ?? 0,
      row?.workload5 ?? 0
    ]
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

  // Get feedback for the course (includes feedback from identical courses)
  const feedback = await db
    .select({
      id: schema.feedback.id,
      courseId: schema.feedback.courseId,
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
        : sql<boolean>`false`.as('has_voted'),
      // Ownership is resolved here, server-side: the card only ever learns
      // "this one is yours", never who wrote any of the others.
      isOwn: currentUserId
        ? // coalesce, because legacy anonymous feedback has a null user_id and
          // `null = <id>` is NULL, not false.
          sql<boolean>`coalesce(${schema.feedback.userId} = ${currentUserId}, false)`.as(
            'is_own'
          )
        : sql<boolean>`false`.as('is_own')
    })
    .from(schema.feedback)
    .innerJoin(schema.courses, eq(schema.feedback.courseId, schema.courses.id))
    .innerJoin(schema.degrees, eq(schema.courses.degreeId, schema.degrees.id))
    .where(queries.getFeedbackWhereCondition(courseIdNum))
    .orderBy(desc(schema.feedback.createdAt))

  return {
    course: {
      ...course,
      name: localizedName.value,
      alternateName:
        course.nameEn && course.nameEn !== course.name
          ? lang === 'en'
            ? course.name
            : course.nameEn
          : null,
      description: content.description?.value ?? null,
      assessment: content.assessment?.value ?? null,
      bibliography: content.bibliography?.value ?? null,
      contentLang: content.langs,
      offerings: course.offerings.map((o) => ({
        curriculumYear: o.curriculumYear,
        academicTerm: {
          name: o.academicTerm.name,
          standardTerm: o.academicTerm.standardTerm,
          startTick: o.academicTerm.startTick,
          endTick: o.academicTerm.endTick
        }
      })),
      ...aggregation,
      degree,
      faculty,
      university: faculty
        ? await loadCrumbUniversity(
            faculty.universityId,
            detectLang(new URL(request.url).pathname)
          )
        : null
    },
    feedback,
    origin: getRequestOrigin(request)
  }
}

type CourseTextField = 'description' | 'assessment' | 'bibliography'

/**
 * Each text field in the page's language, else the other one (`pickTextEither`:
 * Nova SBE and much of Nova FCT publish only in English), else the legacy
 * column with no language attached. Bibliography is language-neutral.
 */
function pickCourseContent(
  lang: ContentLang,
  rows: {
    lang: ContentLang
    description: string | null
    assessment: string | null
    bibliography: string | null
  }[],
  legacy: Record<CourseTextField, string | null>
) {
  const fields: CourseTextField[] = [
    'description',
    'assessment',
    'bibliography'
  ]
  const out: Partial<Record<CourseTextField, Localized<string>>> = {}
  const langs: Partial<
    Record<CourseTextField, { lang: ContentLang; fellBack: boolean }>
  > = {}
  for (const field of fields) {
    if (field === 'bibliography') {
      // A list of books, never translated: one row in the language it is
      // written in, shown as is on both pages, with no "only in X" note.
      const own = rows.find((r) => r.lang === lang)?.bibliography
      const any = own ?? rows.find((r) => r.bibliography)?.bibliography
      const text = any ?? legacy.bibliography
      if (text) out.bibliography = { value: text, lang, fellBack: false }
      continue
    }
    const byLang = Object.fromEntries(rows.map((r) => [r.lang, r[field]]))
    const picked = pickTextEither(lang, byLang)
    if (picked) {
      out[field] = picked
      langs[field] = { lang: picked.lang, fellBack: picked.fellBack }
    } else if (legacy[field]) {
      out[field] = { value: legacy[field]!, lang, fellBack: false }
    }
  }
  return { ...out, langs }
}

export default function CourseDetailPage({ loaderData }: Route.ComponentProps) {
  return (
    <CourseDetailContent
      course={loaderData.course}
      feedback={loaderData.feedback}
    />
  )
}
