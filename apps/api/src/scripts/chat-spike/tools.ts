/**
 * Phase 0 retrieval spike: the tool layer.
 *
 * These are deliberately plain functions over the existing schema. The point of the
 * spike is to find out whether structured retrieval (entity resolution + SQL) can
 * answer real student questions, BEFORE we commit to any chat schema or API.
 *
 * See afonsocrg/prds/2026-08-09_ai_chat.md, Phase 0.
 *
 * Throwaway code. If it survives, it gets promoted into a real
 * `chatRetrievalService` in Phase 1, not copied as-is.
 */
import { database, getFeedbackWhereCondition } from '@uni-feedback/db'
import {
  academicTerms,
  courseOfferings,
  courseRelationships,
  courseStats,
  courses,
  degreeStats,
  degrees,
  faculties,
  feedback,
  feedbackAnalysis
} from '@uni-feedback/db/schema'
import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'

/** Hard bounds. A tool must never return unbounded rows into a prompt. */
const MAX_SEARCH_RESULTS = 15
const MAX_REVIEWS = 12
const MAX_REVIEW_CHARS = 900
const MAX_TEXT_FIELD_CHARS = 1200

function truncate(value: string | null, max: number): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`
}

/**
 * The workload scale is INVERTED: 1 is the heaviest, 5 is the lightest.
 * See `getWorkloadLabel` in packages/utils/src/workload.ts.
 *
 * Every workload number a tool returns is paired with this label, because a bare
 * "averageWorkload: 2" reads as "light" to anything that has not been told the
 * scale runs backwards, and the answer comes out exactly wrong.
 */
function workloadLabel(rating: number | null): string | null {
  if (rating === null) return null
  const labels = ['very heavy', 'heavy', 'moderate', 'light', 'very light']
  return labels[Math.round(rating) - 1] ?? null
}

// ---------------------------------------------------------------------------
// list_faculties
// ---------------------------------------------------------------------------

export async function listFaculties() {
  const rows = await database()
    .select({
      id: faculties.id,
      name: faculties.name,
      shortName: faculties.shortName,
      // Faculty pages are real (`/:facultySlug`), but until this field existed
      // the model was constructing the URL itself, which is rule 3. Every entity
      // a tool returns must carry its own link.
      pageUrl: sql<string>`'https://uni-feedback.com/' || ${faculties.slug}`,
      degreeCount: sql<number>`count(distinct ${degrees.id})`,
      courseCount: sql<number>`count(distinct ${courses.id})`,
      reviewCount: sql<number>`count(${feedback.id}) filter (where ${feedback.approvedAt} is not null)`
    })
    .from(faculties)
    .leftJoin(degrees, eq(degrees.facultyId, faculties.id))
    .leftJoin(courses, eq(courses.degreeId, degrees.id))
    .leftJoin(feedback, eq(feedback.courseId, courses.id))
    .groupBy(faculties.id, faculties.name, faculties.shortName, faculties.slug)
    .orderBy(desc(sql`count(${feedback.id})`))

  return rows.map((r) => ({
    ...r,
    degreeCount: Number(r.degreeCount),
    courseCount: Number(r.courseCount),
    reviewCount: Number(r.reviewCount)
  }))
}

// ---------------------------------------------------------------------------
// search_courses
// ---------------------------------------------------------------------------

/**
 * Entity resolution. This is the part most likely to be the weak link, so the
 * spike should be judged largely on how well this behaves.
 *
 * Matching mirrors the existing search route (unaccent + ILIKE), with exact
 * acronym matches ranked first and better-reviewed courses ahead of empty ones.
 * pg_trgm is NOT installed in production, so no similarity ranking here yet.
 */
/**
 * Relaxed retry for a query that found nothing.
 *
 * Run 1 failed on "LEIC-A" (the degree is stored as "LEIC") and "AM3" (stored as
 * "AM-I"/"AM-II"). Both are the same shape: the student's token carries a suffix
 * the database does not. Falling back to the longest alphanumeric token recovers
 * both without needing pg_trgm.
 *
 * Returns null when relaxing would not change the query.
 */
function relaxQuery(q: string): string | null {
  const tokens = q.split(/[^a-zA-Z0-9À-ÿ]+/).filter(Boolean)
  const alphaTokens = tokens
    .map((t) => t.replace(/[0-9]+/g, ''))
    .filter((t) => t.length >= 2)
  if (alphaTokens.length === 0) return null
  const longest = alphaTokens.reduce((a, b) => (b.length > a.length ? b : a))
  return longest.toLowerCase() === q.toLowerCase() ? null : longest
}

/**
 * Matches a faculty however the student names it.
 *
 * Substring matching is not enough. Run 1 asked for "FCT" against a stored
 * "Nova FCT" and got nothing; run 5 asked for "FCT NOVA" and got nothing again,
 * because the stored words are in the other order. Both times the chat told the
 * student we had no data for a faculty holding 491 reviews.
 *
 * Every token of the input must appear somewhere in the short name or the full
 * name, in any order. "FCT", "FCT NOVA", "Nova FCT" and "Ciencias e Tecnologia"
 * all resolve to the same faculty.
 */
function facultyMatches(input: string): ReturnType<typeof sql> {
  const haystack = sql`unaccent(${faculties.shortName} || ' ' || ${faculties.name})`
  const tokens = input
    .split(/[^a-zA-Z0-9À-ÿ]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 5)
  if (tokens.length === 0) return sql`true`
  return tokens
    .map((t) => sql`${haystack} ILIKE unaccent(${`%${t}%`})`)
    .reduce((acc, cond) => sql`${acc} AND ${cond}`)
}

type CourseSort =
  | 'relevance'
  | 'rating'
  | 'review_count'
  | 'heaviest_workload'
  | 'lightest_workload'

function buildOrderBy(sort: CourseSort, searchTerm: string) {
  switch (sort) {
    case 'rating':
      return [
        desc(sql`coalesce(${courseStats.averageRating}, 0)`),
        asc(courses.name)
      ]
    // Workload runs 1 = very heavy to 5 = very light, so ascending is heaviest.
    case 'heaviest_workload':
      return [
        asc(sql`${courseStats.averageWorkload} nulls last`),
        asc(courses.name)
      ]
    case 'lightest_workload':
      return [
        desc(sql`${courseStats.averageWorkload} nulls last`),
        asc(courses.name)
      ]
    case 'review_count':
      return [
        desc(sql`coalesce(${courseStats.totalFeedbackCount}, 0)`),
        asc(courses.name)
      ]
    default:
      return [
        // Exact acronym hit first: "AMS" must not be buried under fuzzy matches.
        sql`case when unaccent(${courses.acronym}) ILIKE unaccent(${searchTerm}) then 0 else 1 end`,
        desc(sql`coalesce(${courseStats.totalFeedbackCount}, 0)`),
        asc(courses.name)
      ]
  }
}

export async function searchCourses(args: {
  query?: string
  faculty_short_name?: string
  degree_acronym?: string
  curriculum_year?: number
  term?: string
  has_mandatory_exam?: boolean
  sort?: CourseSort
  min_reviews?: number
  limit?: number
}) {
  const limit = Math.min(args.limit ?? 10, MAX_SEARCH_RESULTS)
  const q = (args.query ?? '').trim()
  const sort = args.sort ?? 'relevance'

  async function run(searchTerm: string, fetchLimit: number) {
    const conditions = []

    if (searchTerm) {
      conditions.push(
        sql`(unaccent(${courses.name}) ILIKE unaccent(${`%${searchTerm}%`})
          OR unaccent(${courses.acronym}) ILIKE unaccent(${`%${searchTerm}%`}))`
      )
    }
    if (args.faculty_short_name) {
      conditions.push(facultyMatches(args.faculty_short_name))
    }
    if (args.degree_acronym) {
      conditions.push(
        sql`unaccent(${degrees.acronym}) ILIKE unaccent(${args.degree_acronym})`
      )
    }
    if (args.min_reviews !== undefined) {
      conditions.push(
        sql`coalesce(${courseStats.totalFeedbackCount}, 0) >= ${args.min_reviews}`
      )
    }
    if (args.has_mandatory_exam !== undefined) {
      conditions.push(
        sql`${courses.hasMandatoryExam} is not distinct from ${args.has_mandatory_exam}`
      )
    }
    // EXISTS rather than a join: a course with several offerings would otherwise
    // come back once per offering.
    if (args.curriculum_year !== undefined) {
      conditions.push(
        sql`exists (select 1 from ${courseOfferings} o
          where o.course_id = ${courses.id}
            and o.curriculum_year = ${args.curriculum_year})`
      )
    }
    if (args.term) {
      conditions.push(
        sql`exists (select 1 from ${courseOfferings} o
          join ${academicTerms} t on t.id = o.academic_term_id
          where o.course_id = ${courses.id}
            and unaccent(t.name) ILIKE unaccent(${`%${args.term}%`}))`
      )
    }

    const orderBy = buildOrderBy(sort, searchTerm)

    return database()
      .select({
        courseId: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        ects: courses.ects,
        degreeAcronym: degrees.acronym,
        degreeName: degrees.name,
        facultyShortName: faculties.shortName,
        averageRating: courseStats.averageRating,
        averageWorkload: courseStats.averageWorkload,
        hasMandatoryExam: courses.hasMandatoryExam,
        reviewCount: courseStats.totalFeedbackCount,
        hasDescription: sql<boolean>`(${courses.description} is not null and length(trim(${courses.description})) > 0)`
      })
      .from(courses)
      .innerJoin(degrees, eq(courses.degreeId, degrees.id))
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .leftJoin(courseStats, eq(courseStats.courseId, courses.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(...orderBy)
      .limit(fetchLimit)
  }

  // Over-fetch, because collapsing identical courses below will shrink the list.
  let rows = await run(q, limit * 4)
  let relaxedTo: string | null = null

  if (rows.length === 0 && q) {
    const relaxed = relaxQuery(q)
    if (relaxed) {
      const retried = await run(relaxed, limit * 4)
      if (retried.length > 0) {
        rows = retried
        relaxedTo = relaxed
      }
    }
  }

  const collapsed = (await collapseIdenticalCourses(rows)).slice(0, limit)

  return {
    query: q,
    sort,
    // Tell the model the match was approximate so it can hedge instead of
    // presenting a near-miss as an exact hit.
    relaxedTo,
    resultCount: collapsed.length,
    courses: collapsed
  }
}

type SearchRow = {
  courseId: number
  name: string
  acronym: string
  ects: number | null
  degreeAcronym: string
  degreeName: string
  facultyShortName: string
  averageRating: number | null
  averageWorkload: number | null
  hasMandatoryExam: boolean | null
  reviewCount: number | null
  hasDescription: boolean
}

/**
 * Collapse courses linked as `identical` into one result.
 *
 * The same course is often duplicated across degrees: Nova SBE's "Statistics for
 * Economics and Management" exists in four bachelors with byte-identical stats,
 * because feedback is already merged across the identical set. Returning four rows
 * made run 1 list it four times as if they were different courses, and would make
 * the model ask "which one do you mean?" about a distinction that does not exist.
 *
 * Keeps the best-reviewed row as the representative and records the other degrees
 * in `alsoInDegrees`, so the model can mention them without treating them as
 * separate courses.
 */
async function collapseIdenticalCourses(rows: SearchRow[]) {
  if (rows.length <= 1) {
    return rows.map((r) => ({
      ...r,
      reviewCount: r.reviewCount ?? 0,
      hasDescription: Boolean(r.hasDescription),
      workloadLabel: workloadLabel(r.averageWorkload),
      alsoInDegrees: [] as string[],
      // Every result carries its real URL. The first smoke run showed the model
      // inventing a plausible-looking link when it answered straight from search
      // results without calling get_course. Never make it guess a URL.
      pageUrl: buildCourseUrl(r.courseId)
    }))
  }

  const ids = rows.map((r) => r.courseId)
  const links = await database()
    .select({
      source: courseRelationships.sourceCourseId,
      target: courseRelationships.targetCourseId
    })
    .from(courseRelationships)
    .where(
      and(
        eq(courseRelationships.relationshipType, 'identical'),
        inArray(courseRelationships.sourceCourseId, ids),
        inArray(courseRelationships.targetCourseId, ids)
      )
    )

  // Union-find over the returned ids only.
  const parent = new Map<number, number>(ids.map((id) => [id, id]))
  const find = (x: number): number => {
    let root = x
    while (parent.get(root) !== root) root = parent.get(root) ?? root
    return root
  }
  for (const { source, target } of links) {
    const a = find(source)
    const b = find(target)
    if (a !== b) parent.set(a, b)
  }

  const groups = new Map<number, SearchRow[]>()
  for (const row of rows) {
    const key = find(row.courseId)
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }

  const representatives = [...groups.values()].map((group) => {
    const sorted = [...group].sort(
      (a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
    )
    const [best, ...rest] = sorted
    return {
      ...best,
      reviewCount: best.reviewCount ?? 0,
      hasDescription: Boolean(best.hasDescription),
      workloadLabel: workloadLabel(best.averageWorkload),
      alsoInDegrees: rest.map((r) => r.degreeAcronym),
      pageUrl: buildCourseUrl(best.courseId)
    }
  })

  // Preserve the original ordering by first appearance.
  const order = new Map(rows.map((r, i) => [r.courseId, i]))
  return representatives.sort(
    (a, b) => (order.get(a.courseId) ?? 0) - (order.get(b.courseId) ?? 0)
  )
}

// ---------------------------------------------------------------------------
// get_course
// ---------------------------------------------------------------------------

export async function getCourse(args: { course_id: number }) {
  const [row] = await database()
    .select({
      courseId: courses.id,
      name: courses.name,
      acronym: courses.acronym,
      slug: courses.slug,
      ects: courses.ects,
      description: courses.description,
      assessment: courses.assessment,
      bibliography: courses.bibliography,
      hasMandatoryExam: courses.hasMandatoryExam,
      isMandatory: courses.isMandatory,
      url: courses.url,
      degreeId: degrees.id,
      degreeName: degrees.name,
      degreeAcronym: degrees.acronym,
      degreeType: degrees.type,
      facultyId: faculties.id,
      facultyName: faculties.name,
      facultyShortName: faculties.shortName,
      facultySlug: faculties.slug,
      degreeSlug: degrees.slug,
      averageRating: courseStats.averageRating,
      averageWorkload: courseStats.averageWorkload,
      reviewCount: courseStats.totalFeedbackCount
    })
    .from(courses)
    .innerJoin(degrees, eq(courses.degreeId, degrees.id))
    .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
    .leftJoin(courseStats, eq(courseStats.courseId, courses.id))
    .where(eq(courses.id, args.course_id))
    .limit(1)

  if (!row) return { error: `No course with id ${args.course_id}` }

  const offerings = await database()
    .select({
      curriculumYear: courseOfferings.curriculumYear,
      term: academicTerms.name
    })
    .from(courseOfferings)
    .innerJoin(
      academicTerms,
      eq(courseOfferings.academicTermId, academicTerms.id)
    )
    .where(eq(courseOfferings.courseId, args.course_id))
    .orderBy(asc(courseOfferings.curriculumYear), asc(academicTerms.startTick))

  // How many reviews actually carry a comment, so the model can judge how much
  // opinion evidence exists before it commits to a confident tone.
  const [commentCounts] = await database()
    .select({
      commented: sql<number>`count(*) filter (where ${feedback.comment} is not null and length(trim(${feedback.comment})) > 0)`
    })
    .from(feedback)
    .where(getFeedbackWhereCondition(args.course_id))

  return {
    ...row,
    description: truncate(row.description, MAX_TEXT_FIELD_CHARS),
    assessment: truncate(row.assessment, MAX_TEXT_FIELD_CHARS),
    bibliography: truncate(row.bibliography, 400),
    reviewCount: row.reviewCount ?? 0,
    workloadLabel: workloadLabel(row.averageWorkload),
    commentedReviewCount: Number(commentCounts?.commented ?? 0),
    offerings,
    pageUrl: buildCourseUrl(row.courseId)
  }
}

/**
 * Course pages are id-based, not slug-based: see the `course` entry in
 * apps/website-ssr/app/utils/route-map.ts (`cadeiras/:courseId`). Only faculties
 * and degrees have slug URLs.
 */
function buildCourseUrl(courseId: number): string {
  return `https://uni-feedback.com/cadeiras/${courseId}`
}

// ---------------------------------------------------------------------------
// get_course_reviews
// ---------------------------------------------------------------------------

/**
 * Respects the `identical` course-relationship merge via getFeedbackWhereCondition,
 * so two courses in an identical set can never produce contradictory answers.
 */
export async function getCourseReviews(args: {
  course_id: number
  topic?: 'teaching' | 'assessment' | 'materials' | 'tips'
  limit?: number
}) {
  const limit = Math.min(args.limit ?? 8, MAX_REVIEWS)

  const conditions = [
    getFeedbackWhereCondition(args.course_id),
    isNotNull(feedback.comment),
    sql`length(trim(${feedback.comment})) > 0`
  ]

  if (args.topic) {
    const column = {
      teaching: feedbackAnalysis.hasTeaching,
      assessment: feedbackAnalysis.hasAssessment,
      materials: feedbackAnalysis.hasMaterials,
      tips: feedbackAnalysis.hasTips
    }[args.topic]
    conditions.push(eq(column, true))
  }

  const rows = await database()
    .select({
      rating: feedback.rating,
      workloadRating: feedback.workloadRating,
      schoolYear: feedback.schoolYear,
      comment: feedback.comment
    })
    .from(feedback)
    .leftJoin(feedbackAnalysis, eq(feedbackAnalysis.feedbackId, feedback.id))
    .where(and(...conditions))
    .orderBy(desc(feedback.schoolYear), desc(feedback.createdAt))
    .limit(limit)

  return {
    courseId: args.course_id,
    topic: args.topic ?? null,
    returned: rows.length,
    reviews: rows.map((r) => ({
      ...r,
      workloadLabel: workloadLabel(r.workloadRating),
      comment: truncate(r.comment, MAX_REVIEW_CHARS)
    }))
  }
}

// ---------------------------------------------------------------------------
// search_degrees / get_degree
// ---------------------------------------------------------------------------

export async function searchDegrees(args: {
  query?: string
  faculty_short_name?: string
  limit?: number
}) {
  const limit = Math.min(args.limit ?? 10, MAX_SEARCH_RESULTS)
  const q = (args.query ?? '').trim()

  async function run(searchTerm: string) {
    const conditions = []
    if (searchTerm) {
      conditions.push(
        sql`(unaccent(${degrees.name}) ILIKE unaccent(${`%${searchTerm}%`})
          OR unaccent(${degrees.acronym}) ILIKE unaccent(${`%${searchTerm}%`}))`
      )
    }
    if (args.faculty_short_name) {
      conditions.push(facultyMatches(args.faculty_short_name))
    }
    return runDegreeQuery(conditions, searchTerm, limit)
  }

  let rows = await run(q)
  let relaxedTo: string | null = null

  if (rows.length === 0 && q) {
    const relaxed = relaxQuery(q)
    if (relaxed) {
      const retried = await run(relaxed)
      if (retried.length > 0) {
        rows = retried
        relaxedTo = relaxed
      }
    }
  }

  return { query: q, relaxedTo, resultCount: rows.length, degrees: rows }
}

function runDegreeQuery(
  conditions: ReturnType<typeof sql>[],
  searchTerm: string,
  limit: number
) {
  return database()
    .select({
      degreeId: degrees.id,
      name: degrees.name,
      acronym: degrees.acronym,
      type: degrees.type,
      facultyShortName: faculties.shortName,
      courseCount: degreeStats.courseCount,
      reviewCount: degreeStats.feedbackCount,
      pageUrl: sql<string>`'https://uni-feedback.com/' || ${faculties.slug} || '/' || ${degrees.slug}`
    })
    .from(degrees)
    .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
    .leftJoin(degreeStats, eq(degreeStats.degreeId, degrees.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      sql`case when unaccent(${degrees.acronym}) ILIKE unaccent(${searchTerm}) then 0 else 1 end`,
      desc(sql`coalesce(${degreeStats.feedbackCount}, 0)`),
      asc(degrees.name)
    )
    .limit(limit)
}

export async function getDegree(args: {
  degree_id: number
  curriculum_year?: number
}) {
  const [degree] = await database()
    .select({
      degreeId: degrees.id,
      name: degrees.name,
      acronym: degrees.acronym,
      type: degrees.type,
      description: degrees.description,
      url: degrees.url,
      slug: degrees.slug,
      facultyName: faculties.name,
      facultyShortName: faculties.shortName,
      facultySlug: faculties.slug,
      courseCount: degreeStats.courseCount,
      reviewCount: degreeStats.feedbackCount
    })
    .from(degrees)
    .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
    .leftJoin(degreeStats, eq(degreeStats.degreeId, degrees.id))
    .where(eq(degrees.id, args.degree_id))
    .limit(1)

  if (!degree) return { error: `No degree with id ${args.degree_id}` }

  const curriculum = await database()
    .select({
      courseId: courses.id,
      name: courses.name,
      acronym: courses.acronym,
      ects: courses.ects,
      isMandatory: courses.isMandatory,
      // Run 1, Q4 ("which MEIC courses have no mandatory exam?") failed because
      // the curriculum did not carry this field, so the model correctly said it
      // could not answer. That was a tool gap, not a model failure.
      hasMandatoryExam: courses.hasMandatoryExam,
      curriculumYear: courseOfferings.curriculumYear,
      term: academicTerms.name,
      averageRating: courseStats.averageRating,
      averageWorkload: courseStats.averageWorkload,
      reviewCount: courseStats.totalFeedbackCount,
      pageUrl: sql<string>`'https://uni-feedback.com/cadeiras/' || ${courses.id}`
    })
    .from(courses)
    .leftJoin(courseOfferings, eq(courseOfferings.courseId, courses.id))
    .leftJoin(
      academicTerms,
      eq(courseOfferings.academicTermId, academicTerms.id)
    )
    .leftJoin(courseStats, eq(courseStats.courseId, courses.id))
    .where(
      args.curriculum_year === undefined
        ? eq(courses.degreeId, args.degree_id)
        : and(
            eq(courses.degreeId, args.degree_id),
            eq(courseOfferings.curriculumYear, args.curriculum_year)
          )
    )
    .orderBy(asc(courseOfferings.curriculumYear), asc(courses.name))
    .limit(200)

  return {
    ...degree,
    description: truncate(degree.description, MAX_TEXT_FIELD_CHARS),
    pageUrl:
      degree.facultySlug && degree.slug
        ? `https://uni-feedback.com/${degree.facultySlug}/${degree.slug}`
        : null,
    curriculumYearFilter: args.curriculum_year ?? null,
    curriculum: curriculum.map((c) => ({
      ...c,
      reviewCount: c.reviewCount ?? 0,
      workloadLabel: workloadLabel(c.averageWorkload)
    }))
  }
}

// ---------------------------------------------------------------------------
// Tool registry (OpenAI / OpenRouter function-calling format)
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'list_faculties',
      description:
        'List every university faculty Uni Feedback covers, with how many degrees, courses and student reviews we hold for each. Use this to check whether we cover a university before answering about it.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_courses',
      description:
        'Find courses by name or acronym, or list courses ranked by rating. Always call this first to turn a course name the student mentioned into a course_id. Returns candidates, not an answer. If `relaxedTo` is set in the response, the exact term found nothing and these are approximate matches for a shorter term: say so instead of presenting them as exact.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Course name or acronym, e.g. "AMS" or "Análise Matemática". Omit to list/rank without a text filter.'
          },
          faculty_short_name: {
            type: 'string',
            description: 'Optional filter, e.g. "IST", "Nova SBE"'
          },
          degree_acronym: {
            type: 'string',
            description: 'Optional degree filter, e.g. "MEIC", "LEIC"'
          },
          curriculum_year: {
            type: 'number',
            description:
              'Only courses taught in this year of the degree plan (1, 2, 3...). Use it for "cadeiras do 3º ano".'
          },
          term: {
            type: 'string',
            description:
              'Only courses taught in a term whose name contains this, e.g. "1" for 1st semester, "Semestre", "P1". Term names vary by faculty.'
          },
          has_mandatory_exam: {
            type: 'boolean',
            description: 'Filter by whether the course has a mandatory exam.'
          },
          sort: {
            type: 'string',
            enum: [
              'relevance',
              'rating',
              'review_count',
              'heaviest_workload',
              'lightest_workload'
            ],
            description:
              'Use "rating" for "best/worst rated". Use "heaviest_workload" for "hardest / most demanding / mais dificil / mais trabalhosa" and "lightest_workload" for the opposite: DIFFICULTY IS WORKLOAD, NOT RATING. A low rating means students disliked the course, which is a different thing from it being hard. Always pair a sort with min_reviews, otherwise one 5-star review outranks forty.'
          },
          min_reviews: {
            type: 'number',
            description:
              'Only return courses with at least this many reviews. Use 10 or more when ranking by rating.'
          },
          limit: { type: 'number', description: 'Max results, default 10' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_course',
      description:
        'Full record for one course: description, ECTS, assessment, which curriculum year and term it runs in, average rating and workload, and how many reviews carry a written comment. Read workloadLabel, not the raw number: the workload scale is inverted (1 = very heavy, 5 = very light).',
      parameters: {
        type: 'object',
        properties: { course_id: { type: 'number' } },
        required: ['course_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_course_reviews',
      description:
        'Real student review comments for a course, newest first. Quote these verbatim. Optionally filter to one topic. Each review carries workloadLabel alongside workloadRating, because the raw scale is inverted (1 = very heavy, 5 = very light).',
      parameters: {
        type: 'object',
        properties: {
          course_id: { type: 'number' },
          topic: {
            type: 'string',
            enum: ['teaching', 'assessment', 'materials', 'tips']
          },
          limit: {
            type: 'number',
            description: 'Max reviews, default 8, cap 12'
          }
        },
        required: ['course_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_degrees',
      description:
        'Find degrees (licenciaturas, mestrados) by name or acronym, to turn a degree the student mentioned into a degree_id. Students often use a variant we do not store (e.g. "LEIC-A" when the degree is "LEIC"), so if `relaxedTo` is set, these are approximate matches: name the degree you actually found rather than claiming the one they typed does not exist.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          faculty_short_name: { type: 'string' },
          limit: { type: 'number' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_degree',
      description:
        'Full record for one degree, including its curriculum: every course with its curriculum year, term, ECTS, mandatory-exam flag, rating and workload. Pass curriculum_year to get just one year, which is much smaller and cheaper than the whole plan.',
      parameters: {
        type: 'object',
        properties: {
          degree_id: { type: 'number' },
          curriculum_year: {
            type: 'number',
            description:
              'Optional: only courses of this year of the plan (1, 2, 3...).'
          }
        },
        required: ['degree_id']
      }
    }
  }
] as const

type ToolArgs = Record<string, unknown>

export async function executeTool(
  name: string,
  args: ToolArgs
): Promise<unknown> {
  switch (name) {
    case 'list_faculties':
      return listFaculties()
    case 'search_courses':
      return searchCourses(args as Parameters<typeof searchCourses>[0])
    case 'get_course':
      return getCourse(args as Parameters<typeof getCourse>[0])
    case 'get_course_reviews':
      return getCourseReviews(args as Parameters<typeof getCourseReviews>[0])
    case 'search_degrees':
      return searchDegrees(args as Parameters<typeof searchDegrees>[0])
    case 'get_degree':
      return getDegree(args as Parameters<typeof getDegree>[0])
    default:
      return { error: `Unknown tool: ${name}` }
  }
}
