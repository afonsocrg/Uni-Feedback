import {
  database,
  getFeedbackWhereCondition,
  getRelatedCourseIdsSubquery
} from '@uni-feedback/db'
import {
  academicTerms,
  courseGradeStats,
  courseGroup,
  courseGroupsCourses,
  courseOfferings,
  courseRelationships,
  courseStats,
  courses,
  degreeStats,
  degrees,
  faculties,
  feedback,
  feedbackAnalysis,
  type DegreeType
} from '@uni-feedback/db/schema'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
  sql
} from 'drizzle-orm'

/**
 * Retrieval for the AI chat.
 *
 * Promoted from the Phase 0 spike (`apps/api/src/scripts/chat-spike/tools.ts`)
 * after it showed that structured retrieval answers real student questions
 * without pgvector: almost every question names a course, degree or university,
 * which makes this entity resolution rather than semantic search.
 *
 * The behaviour here is shaped almost entirely by failures the spike found, and
 * each one is commented where it lives. The theme running through them is that
 * **the dangerous failure is not a wrong answer, it is a confident empty one**:
 * a search that finds nothing reads to a student exactly like an honest "we have
 * no data", and they leave. Every widening below exists because of one of those.
 *
 * Plan: afonsocrg/prds/2026-08-09_ai_chat.md (Phase 1)
 */

/** Hard bounds. A tool must never return unbounded rows into a prompt. */
const MAX_SEARCH_RESULTS = 15
const MAX_REVIEWS = 12
const MAX_REVIEW_CHARS = 900
const MAX_TEXT_FIELD_CHARS = 1200
const MAX_CURRICULUM_COURSES = 200
/** Alternative terms one search may carry, and results kept per term. */
const MAX_SEARCH_TERMS = 8
const MAX_RESULTS_PER_TERM = 8

/**
 * Trigram similarity floor for the last-resort fuzzy pass. Low enough to catch
 * real typos and variants, high enough that a two-letter overlap does not drag in
 * half the catalogue.
 */
const SIMILARITY_THRESHOLD = 0.3

const SITE_URL = 'https://uni-feedback.com'

export type CourseSort =
  | 'relevance'
  | 'rating'
  | 'review_count'
  | 'heaviest_workload'
  | 'lightest_workload'

export interface SearchCoursesArgs {
  query?: string
  /**
   * Several alternative terms, searched in one call. A course matching any of
   * them is returned. Exists so "courses about control, navigation or robotics"
   * is one call rather than one per keyword, which is what burned iterations.
   */
  queries?: string[]
  facultyName?: string
  degreeAcronym?: string
  curriculumYear?: number
  term?: string
  hasMandatoryExam?: boolean
  sort?: CourseSort
  minReviews?: number
  /** Exact ECTS value, e.g. 3 or 7.5. */
  ects?: number
  degreeLevel?: DegreeLevel
  /**
   * Part of a course group's name, e.g. "Inteligência Artificial". Groups are
   * whatever a faculty bundles courses into: MEIC specializations, MEEC areas,
   * FLUL majors and minors.
   */
  courseGroup?: string
  limit?: number
}

/**
 * The model asks by level, which is coarser than `degrees.type`: an integrated
 * master's counts as a master's.
 */
export type DegreeLevel = 'bachelor' | 'master' | 'minor'

const DEGREE_TYPES_BY_LEVEL: Record<DegreeLevel, DegreeType[]> = {
  bachelor: ['bachelor'],
  master: ['master', 'integrated_master'],
  minor: ['minor']
}

export interface SearchDegreesArgs {
  query?: string
  facultyName?: string
  limit?: number
}

/** How a result set was found, so callers can tell an exact hit from a guess. */
export type MatchMode = 'exact' | 'relaxed' | 'fuzzy'

// ---------------------------------------------------------------------------
// Shared SQL helpers
// ---------------------------------------------------------------------------

/**
 * Must be `immutable_unaccent`, not `unaccent`.
 *
 * The trigram indexes in migration 0039 are built on `immutable_unaccent(name)`,
 * and Postgres only uses an expression index when the query names the same
 * function. Calling plain `unaccent()` here would silently fall back to a
 * sequential scan over 8,000 courses.
 */
function normalized(column: unknown) {
  return sql`immutable_unaccent(${column})`
}

function unaccented(value: string) {
  return sql`immutable_unaccent(${value})`
}

/**
 * The workload scale is INVERTED: 1 is the heaviest, 5 is the lightest
 * (`getWorkloadLabel` in packages/utils/src/workload.ts).
 *
 * Every workload number this service returns is paired with a label, because a
 * bare "2" reads as "light" to anything not told the scale runs backwards, and
 * the answer then comes out exactly wrong. The spike shipped that bug once.
 */
export function workloadLabel(rating: number | null): string | null {
  if (rating === null || rating === undefined) return null
  const labels = ['very heavy', 'heavy', 'moderate', 'light', 'very light']
  return labels[Math.round(rating) - 1] ?? null
}

/**
 * School years leave this service as "2025/2026", never as the stored start
 * year. A bare 2025 is read as "2024/2025" about as often as "2025/2026".
 */
function schoolYearLabel(year: number | null): string | null {
  return year === null ? null : formatSchoolYearString(year)
}

function truncate(value: string | null, max: number): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`
}

export function courseUrl(courseId: number): string {
  // Course pages are id-based (`cadeiras/:courseId` in route-map.ts). Only
  // faculties and degrees have slug URLs.
  return `${SITE_URL}/cadeiras/${courseId}`
}

/**
 * Matches a faculty however the student names it.
 *
 * Substring matching is not enough, and this bug class appeared three times in
 * the spike in three different forms: "FCT" against a stored "Nova FCT", then
 * "FCT NOVA" against the same row with the words reversed. Both times the chat
 * reported no data for a faculty holding 491 reviews.
 *
 * Every token of the input must appear somewhere in the short name or the full
 * name, in any order.
 */
function facultyMatches(input: string) {
  const haystack = sql`immutable_unaccent(${faculties.shortName} || ' ' || ${faculties.name})`
  const tokens = input
    .split(/[^a-zA-Z0-9À-ÿ]+/)
    .filter((t) => t.length >= 2)
    .slice(0, 5)
  if (tokens.length === 0) return sql`true`
  return tokens
    .map((t) => sql`${haystack} ILIKE ${unaccented(`%${t}%`)}`)
    .reduce((acc, cond) => sql`${acc} AND ${cond}`)
}

/**
 * Relaxed retry for a query that found nothing.
 *
 * Students carry suffixes our data does not: "LEIC-A" where we store "LEIC",
 * "AM3" where we store "AM-I"/"AM-II". Falling back to the longest alphabetic
 * token recovers both. Returns null when relaxing would not change the query.
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

// ---------------------------------------------------------------------------

/** "2025/2026" for a discontinued course, null for one still taught. */
function lastTaughtSchoolYear(lastTaughtYear: number | null) {
  return lastTaughtYear == null ? null : formatSchoolYearString(lastTaughtYear)
}

interface CourseRow {
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
  lastTaughtYear: number | null
}

export class ChatRetrievalService {
  // -------------------------------------------------------------------------
  // Faculties
  // -------------------------------------------------------------------------

  async listFaculties() {
    const rows = await database()
      .select({
        id: faculties.id,
        name: faculties.name,
        shortName: faculties.shortName,
        // Every entity carries its own link. The spike showed that if a tool
        // returns an entity without a URL, the model eventually builds one, and
        // an invented link is indistinguishable from a real one until clicked.
        pageUrl: sql<string>`${SITE_URL} || '/' || ${faculties.slug}`,
        // From degree_stats rather than a join over every course and review:
        // this runs on every turn of a faculty-scoped chat, and the full join
        // was the most expensive query a turn made.
        degreeCount: sql<number>`count(${degrees.id})`,
        courseCount: sql<number>`coalesce(sum(${degreeStats.courseCount}), 0)`,
        reviewCount: sql<number>`coalesce(sum(${degreeStats.feedbackCount}), 0)`
      })
      .from(faculties)
      .leftJoin(degrees, eq(degrees.facultyId, faculties.id))
      .leftJoin(degreeStats, eq(degreeStats.degreeId, degrees.id))
      .groupBy(
        faculties.id,
        faculties.name,
        faculties.shortName,
        faculties.slug
      )
      .orderBy(desc(sql`coalesce(sum(${degreeStats.feedbackCount}), 0)`))

    return rows.map((r) => ({
      ...r,
      degreeCount: Number(r.degreeCount),
      courseCount: Number(r.courseCount),
      reviewCount: Number(r.reviewCount)
    }))
  }

  // -------------------------------------------------------------------------
  // Courses
  // -------------------------------------------------------------------------

  async searchCourses(args: SearchCoursesArgs) {
    const terms = [
      ...new Set(
        [args.query, ...(args.queries ?? [])]
          .map((t) => (t ?? '').trim())
          .filter(Boolean)
      )
    ].slice(0, MAX_SEARCH_TERMS)
    if (terms.length <= 1) {
      return this.searchOneTerm({
        ...args,
        query: terms[0],
        queries: undefined
      })
    }

    // One search per term, in parallel, so each keeps its own relaxed and
    // fuzzy fallbacks and its own `matchMode`. A shared OR query would lose
    // both, and with them the "this term found nothing" signal rule 9 needs.
    const perTerm = Math.max(1, Math.min(args.limit ?? 5, MAX_RESULTS_PER_TERM))
    const results = await Promise.all(
      terms.map((query) =>
        this.searchOneTerm({
          ...args,
          query,
          queries: undefined,
          limit: perTerm
        })
      )
    )

    // Merged and deduplicated: a course two terms found is listed once, with
    // both terms, rather than twice at full size.
    type Course = (typeof results)[number]['courses'][number]
    const merged = new Map<number, Course & { matchedQueries: string[] }>()
    results.forEach((result, i) => {
      for (const course of result.courses) {
        const seen = merged.get(course.courseId)
        if (seen) seen.matchedQueries.push(terms[i])
        else
          merged.set(course.courseId, { ...course, matchedQueries: [terms[i]] })
      }
    })

    return {
      queries: results.map((r) => ({
        query: r.query,
        matchMode: r.matchMode,
        matchedTerm: r.matchedTerm,
        resultCount: r.resultCount
      })),
      sort: args.sort ?? 'relevance',
      resultCount: merged.size,
      courses: [...merged.values()]
    }
  }

  private async searchOneTerm(args: SearchCoursesArgs) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, MAX_SEARCH_RESULTS))
    const q = (args.query ?? '').trim()
    const sort = args.sort ?? 'relevance'

    // Over-fetch: collapsing identical courses below shrinks the list.
    const fetchLimit = limit * 4

    let rows = await this.runCourseQuery(args, q, sort, fetchLimit, false)
    let matchMode: MatchMode = 'exact'
    let matchedTerm = q

    if (rows.length === 0 && q) {
      const relaxed = relaxQuery(q)
      if (relaxed) {
        const retried = await this.runCourseQuery(
          args,
          relaxed,
          sort,
          fetchLimit,
          false
        )
        if (retried.length > 0) {
          rows = retried
          matchMode = 'relaxed'
          matchedTerm = relaxed
        }
      }
    }

    // Last resort: trigram similarity, for typos and variants that token
    // relaxation cannot reach. Only reachable once the cheaper passes are empty,
    // so the common case never pays for it.
    if (rows.length === 0 && q) {
      const fuzzy = await this.runCourseQuery(args, q, sort, fetchLimit, true)
      if (fuzzy.length > 0) {
        rows = fuzzy
        matchMode = 'fuzzy'
      }
    }

    const collapsed = (await this.collapseIdenticalCourses(rows)).slice(
      0,
      limit
    )

    return {
      query: q,
      sort,
      /**
       * 'exact' | 'relaxed' | 'fuzzy'. Anything but 'exact' means the term the
       * student typed found nothing and these are approximations. Callers must
       * pass this to the model so it hedges instead of presenting a near-miss as
       * a hit: the spike answered a question about "AM3" with an unrelated course
       * because it could not tell the difference.
       */
      matchMode,
      matchedTerm: matchMode === 'exact' ? q : matchedTerm,
      resultCount: collapsed.length,
      courses: collapsed
    }
  }

  private async runCourseQuery(
    args: SearchCoursesArgs,
    searchTerm: string,
    sort: CourseSort,
    fetchLimit: number,
    fuzzy: boolean
  ): Promise<CourseRow[]> {
    const conditions = []

    if (searchTerm) {
      conditions.push(
        fuzzy
          ? sql`(similarity(${normalized(courses.name)}, ${unaccented(searchTerm)}) > ${SIMILARITY_THRESHOLD}
              OR similarity(${normalized(courses.acronym)}, ${unaccented(searchTerm)}) > ${SIMILARITY_THRESHOLD})`
          : sql`(${normalized(courses.name)} ILIKE ${unaccented(`%${searchTerm}%`)}
              OR ${normalized(courses.acronym)} ILIKE ${unaccented(`%${searchTerm}%`)})`
      )
    }
    if (args.facultyName) {
      conditions.push(facultyMatches(args.facultyName))
    }
    if (args.degreeAcronym) {
      conditions.push(
        sql`${normalized(degrees.acronym)} ILIKE ${unaccented(args.degreeAcronym)}`
      )
    }
    if (args.minReviews !== undefined) {
      conditions.push(
        sql`coalesce(${courseStats.totalFeedbackCount}, 0) >= ${args.minReviews}`
      )
    }
    if (args.ects !== undefined) {
      conditions.push(sql`${courses.ects} = ${args.ects}`)
    }
    if (args.degreeLevel) {
      conditions.push(
        inArray(degrees.type, DEGREE_TYPES_BY_LEVEL[args.degreeLevel])
      )
    }
    if (args.courseGroup) {
      conditions.push(
        sql`exists (select 1 from ${courseGroupsCourses} m
          join ${courseGroup} g on g.id = m.course_group_id
          where m.course_id = ${courses.id}
            and immutable_unaccent(g.name) ILIKE ${unaccented(`%${args.courseGroup}%`)})`
      )
    }
    if (args.hasMandatoryExam !== undefined) {
      conditions.push(
        sql`${courses.hasMandatoryExam} is not distinct from ${args.hasMandatoryExam}`
      )
    }
    // EXISTS rather than a join: a course with several offerings would otherwise
    // come back once per offering.
    if (args.curriculumYear !== undefined) {
      conditions.push(
        sql`exists (select 1 from ${courseOfferings} o
          where o.course_id = ${courses.id}
            and o.curriculum_year = ${args.curriculumYear})`
      )
    }
    if (args.term) {
      conditions.push(
        sql`exists (select 1 from ${courseOfferings} o
          join ${academicTerms} t on t.id = o.academic_term_id
          where o.course_id = ${courses.id}
            and immutable_unaccent(t.name) ILIKE ${unaccented(`%${args.term}%`)})`
      )
    }

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
        lastTaughtYear: courses.lastTaughtYear,
        hasDescription: sql<boolean>`(${courses.description} is not null and length(trim(${courses.description})) > 0)`
      })
      .from(courses)
      .innerJoin(degrees, eq(courses.degreeId, degrees.id))
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .leftJoin(courseStats, eq(courseStats.courseId, courses.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(...this.courseOrderBy(sort, searchTerm))
      .limit(fetchLimit)
  }

  private courseOrderBy(sort: CourseSort, searchTerm: string) {
    switch (sort) {
      case 'rating':
        return [
          desc(sql`coalesce(${courseStats.averageRating}, 0)`),
          asc(courses.name)
        ]
      // Workload runs 1 = very heavy to 5 = very light, so ascending is heaviest.
      //
      // The direction is written into the SQL rather than wrapped in asc() /
      // desc(): those append their keyword after the expression, which made
      // this `... nulls last asc`, a syntax error. Every workload sort failed
      // on production until 2026-09-23, reading to the model as a failed search.
      case 'heaviest_workload':
        return [
          sql`${courseStats.averageWorkload} asc nulls last`,
          asc(courses.name)
        ]
      case 'lightest_workload':
        return [
          sql`${courseStats.averageWorkload} desc nulls last`,
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
          sql`case when ${normalized(courses.acronym)} ILIKE ${unaccented(searchTerm)} then 0 else 1 end`,
          desc(sql`coalesce(${courseStats.totalFeedbackCount}, 0)`),
          asc(courses.name)
        ]
    }
  }

  /**
   * Collapse courses linked as `identical` into one result.
   *
   * The same course is often duplicated across degrees: Nova SBE's "Statistics
   * for Economics and Management" exists in four bachelors with byte-identical
   * stats, because feedback is already merged across the identical set. Returning
   * four rows makes the model list it four times as different courses, and makes
   * it ask "which one did you mean?" about a distinction that does not exist.
   */
  private async collapseIdenticalCourses(rows: CourseRow[]) {
    const decorate = (
      { lastTaughtYear, ...row }: CourseRow,
      alsoInDegrees: string[]
    ) => ({
      ...row,
      lastTaughtSchoolYear: lastTaughtSchoolYear(lastTaughtYear),
      reviewCount: row.reviewCount ?? 0,
      hasDescription: Boolean(row.hasDescription),
      workloadLabel: workloadLabel(row.averageWorkload),
      alsoInDegrees,
      pageUrl: courseUrl(row.courseId)
    })

    if (rows.length <= 1) return rows.map((r) => decorate(r, []))

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

    const groups = new Map<number, CourseRow[]>()
    for (const row of rows) {
      const key = find(row.courseId)
      const bucket = groups.get(key)
      if (bucket) bucket.push(row)
      else groups.set(key, [row])
    }

    const representatives = [...groups.values()].map((group) => {
      // The row still taught speaks for the set: its page is the one to link
      const sorted = [...group].sort(
        (a, b) =>
          Number(a.lastTaughtYear != null) - Number(b.lastTaughtYear != null) ||
          (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
      )
      const [best, ...rest] = sorted
      return decorate(
        best,
        rest.map((r) => r.degreeAcronym)
      )
    })

    // Preserve the original ordering by first appearance.
    const order = new Map(rows.map((r, i) => [r.courseId, i]))
    return representatives.sort(
      (a, b) => (order.get(a.courseId) ?? 0) - (order.get(b.courseId) ?? 0)
    )
  }

  async getCourse(courseId: number) {
    const [row] = await database()
      .select({
        courseId: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        ects: courses.ects,
        description: courses.description,
        assessment: courses.assessment,
        bibliography: courses.bibliography,
        hasMandatoryExam: courses.hasMandatoryExam,
        isMandatory: courses.isMandatory,
        lastTaughtYear: courses.lastTaughtYear,
        degreeId: degrees.id,
        degreeName: degrees.name,
        degreeAcronym: degrees.acronym,
        degreeType: degrees.type,
        facultyId: faculties.id,
        facultyName: faculties.name,
        facultyShortName: faculties.shortName,
        averageRating: courseStats.averageRating,
        averageWorkload: courseStats.averageWorkload,
        reviewCount: courseStats.totalFeedbackCount
      })
      .from(courses)
      .innerJoin(degrees, eq(courses.degreeId, degrees.id))
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .leftJoin(courseStats, eq(courseStats.courseId, courses.id))
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!row) return null

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
      .where(eq(courseOfferings.courseId, courseId))
      .orderBy(
        asc(courseOfferings.curriculumYear),
        asc(academicTerms.startTick)
      )

    // How many reviews carry a comment, so the caller can judge how much opinion
    // evidence exists before committing to a confident tone.
    const [counts] = await database()
      .select({
        commented: sql<number>`count(*) filter (where ${feedback.comment} is not null and length(trim(${feedback.comment})) > 0)`
      })
      .from(feedback)
      .where(getFeedbackWhereCondition(courseId))

    // Grades are entered against whichever row of an identical set we had at
    // hand, so read the whole set. One year per entry: the course's own row wins.
    const gradeRows = await database()
      .select({
        courseId: courseGradeStats.courseId,
        schoolYear: courseGradeStats.schoolYear,
        averageGrade: courseGradeStats.averageGrade
      })
      .from(courseGradeStats)
      .where(
        or(
          eq(courseGradeStats.courseId, courseId),
          inArray(
            courseGradeStats.courseId,
            getRelatedCourseIdsSubquery(courseId)
          )
        )
      )
      .orderBy(desc(courseGradeStats.schoolYear))
    const gradesByYear = new Map<number, (typeof gradeRows)[number]>()
    for (const g of gradeRows) {
      const seen = gradesByYear.get(g.schoolYear)
      if (!seen || g.courseId === courseId) gradesByYear.set(g.schoolYear, g)
    }
    const gradeAverages = [...gradesByYear.values()].map((g) => ({
      schoolYear: formatSchoolYearString(g.schoolYear),
      averageGrade: Math.round(g.averageGrade * 10) / 10
    }))

    const groups = await database()
      .select({ name: courseGroup.name })
      .from(courseGroupsCourses)
      .innerJoin(
        courseGroup,
        eq(courseGroupsCourses.courseGroupId, courseGroup.id)
      )
      .where(eq(courseGroupsCourses.courseId, courseId))
      .orderBy(asc(courseGroup.name))

    const { lastTaughtYear, ...rest } = row
    return {
      ...rest,
      lastTaughtSchoolYear: lastTaughtSchoolYear(lastTaughtYear),
      description: truncate(row.description, MAX_TEXT_FIELD_CHARS),
      assessment: truncate(row.assessment, MAX_TEXT_FIELD_CHARS),
      bibliography: truncate(row.bibliography, 400),
      reviewCount: row.reviewCount ?? 0,
      workloadLabel: workloadLabel(row.averageWorkload),
      commentedReviewCount: Number(counts?.commented ?? 0),
      offerings,
      groups: groups.map((g) => g.name),
      gradeAverages,
      pageUrl: courseUrl(row.courseId)
    }
  }

  /**
   * Real review comments, newest first.
   *
   * Respects the `identical` course-relationship merge via
   * `getFeedbackWhereCondition`, so two courses in an identical set can never
   * produce contradictory answers.
   *
   * `schoolYear` is the start year (2025 = 2025/2026). Without the filter and
   * the per-year counts, the model was asked for "only 2025/2026 feedback",
   * received a mixed page of reviews, and invented the counts: it reported 4
   * reviews for a year that had 2, and 2 for one that had 4. The counts cover
   * every year whatever the filter, so an empty filtered result can still say
   * which years do have reviews instead of reading as "no data".
   */
  async getCourseReviews(args: {
    courseId: number
    topic?: 'teaching' | 'assessment' | 'materials' | 'tips'
    schoolYear?: number
    limit?: number
  }) {
    const limit = Math.max(1, Math.min(args.limit ?? 8, MAX_REVIEWS))

    const conditions = [
      getFeedbackWhereCondition(args.courseId),
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

    if (args.schoolYear !== undefined) {
      conditions.push(eq(feedback.schoolYear, args.schoolYear))
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

    const byYear = await database()
      .select({
        schoolYear: feedback.schoolYear,
        reviews: sql<number>`count(*)`,
        withComment: sql<number>`count(*) filter (where ${feedback.comment} is not null and length(trim(${feedback.comment})) > 0)`
      })
      .from(feedback)
      .where(getFeedbackWhereCondition(args.courseId))
      .groupBy(feedback.schoolYear)
      .orderBy(desc(feedback.schoolYear))

    return {
      courseId: args.courseId,
      topic: args.topic ?? null,
      schoolYear:
        args.schoolYear !== undefined
          ? formatSchoolYearString(args.schoolYear)
          : null,
      currentSchoolYear: formatSchoolYearString(getCurrentSchoolYear()),
      returned: rows.length,
      reviewsBySchoolYear: byYear.map((y) => ({
        schoolYear: schoolYearLabel(y.schoolYear),
        reviews: Number(y.reviews),
        withComment: Number(y.withComment)
      })),
      reviews: rows.map((r) => ({
        ...r,
        schoolYear: schoolYearLabel(r.schoolYear),
        workloadLabel: workloadLabel(r.workloadRating),
        comment: truncate(r.comment, MAX_REVIEW_CHARS)
      }))
    }
  }

  // -------------------------------------------------------------------------
  // Degrees
  // -------------------------------------------------------------------------

  async searchDegrees(args: SearchDegreesArgs) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, MAX_SEARCH_RESULTS))
    const q = (args.query ?? '').trim()

    let rows = await this.runDegreeQuery(args, q, limit, false)
    let matchMode: MatchMode = 'exact'
    let matchedTerm = q

    if (rows.length === 0 && q) {
      const relaxed = relaxQuery(q)
      if (relaxed) {
        const retried = await this.runDegreeQuery(args, relaxed, limit, false)
        if (retried.length > 0) {
          rows = retried
          matchMode = 'relaxed'
          matchedTerm = relaxed
        }
      }
    }

    if (rows.length === 0 && q) {
      const fuzzy = await this.runDegreeQuery(args, q, limit, true)
      if (fuzzy.length > 0) {
        rows = fuzzy
        matchMode = 'fuzzy'
      }
    }

    return {
      query: q,
      matchMode,
      matchedTerm: matchMode === 'exact' ? q : matchedTerm,
      resultCount: rows.length,
      degrees: rows
    }
  }

  private runDegreeQuery(
    args: SearchDegreesArgs,
    searchTerm: string,
    limit: number,
    fuzzy: boolean
  ) {
    const conditions = []

    if (searchTerm) {
      conditions.push(
        fuzzy
          ? sql`(similarity(${normalized(degrees.name)}, ${unaccented(searchTerm)}) > ${SIMILARITY_THRESHOLD}
              OR similarity(${normalized(degrees.acronym)}, ${unaccented(searchTerm)}) > ${SIMILARITY_THRESHOLD})`
          : sql`(${normalized(degrees.name)} ILIKE ${unaccented(`%${searchTerm}%`)}
              OR ${normalized(degrees.acronym)} ILIKE ${unaccented(`%${searchTerm}%`)})`
      )
    }
    if (args.facultyName) {
      conditions.push(facultyMatches(args.facultyName))
    }

    return database()
      .select({
        degreeId: degrees.id,
        name: degrees.name,
        acronym: degrees.acronym,
        type: degrees.type,
        facultyShortName: faculties.shortName,
        courseCount: degreeStats.courseCount,
        reviewCount: degreeStats.feedbackCount,
        pageUrl: sql<string>`${SITE_URL} || '/' || ${faculties.slug} || '/' || ${degrees.slug}`
      })
      .from(degrees)
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .leftJoin(degreeStats, eq(degreeStats.degreeId, degrees.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        sql`case when ${normalized(degrees.acronym)} ILIKE ${unaccented(searchTerm)} then 0 else 1 end`,
        desc(sql`coalesce(${degreeStats.feedbackCount}, 0)`),
        asc(degrees.name)
      )
      .limit(limit)
  }

  /**
   * A degree's course groups, each with its courses.
   *
   * Groups are whatever a faculty bundles a degree's courses into: MEIC
   * specializations, MEEC main and secondary areas, FLUL majors and minors.
   * Without a `groupName` every group comes back, which for FLUL's LLC is 60
   * groups and 600 memberships. Past `MAX_CURRICULUM_COURSES` memberships the
   * courses are left out and the model is told to narrow, rather than spending
   * a whole context on one listing.
   */
  async getCourseGroups(args: { degreeId: number; groupName?: string }) {
    const [degree] = await database()
      .select({
        degreeId: degrees.id,
        name: degrees.name,
        acronym: degrees.acronym,
        facultyShortName: faculties.shortName,
        pageUrl: sql<string>`${SITE_URL} || '/' || ${faculties.slug} || '/' || ${degrees.slug}`
      })
      .from(degrees)
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .where(eq(degrees.id, args.degreeId))
      .limit(1)

    if (!degree) return null

    const rows = await database()
      .select({
        groupName: courseGroup.name,
        courseId: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        ects: courses.ects,
        averageRating: courseStats.averageRating,
        averageWorkload: courseStats.averageWorkload,
        reviewCount: courseStats.totalFeedbackCount
      })
      .from(courseGroup)
      .innerJoin(
        courseGroupsCourses,
        eq(courseGroupsCourses.courseGroupId, courseGroup.id)
      )
      .innerJoin(courses, eq(courses.id, courseGroupsCourses.courseId))
      .leftJoin(courseStats, eq(courseStats.courseId, courses.id))
      .where(
        and(
          eq(courseGroup.degreeId, args.degreeId),
          isNull(courses.lastTaughtYear),
          args.groupName
            ? sql`${normalized(courseGroup.name)} ILIKE ${unaccented(`%${args.groupName}%`)}`
            : undefined
        )
      )
      .orderBy(asc(courseGroup.name), asc(courses.name))

    const coursesIncluded = rows.length <= MAX_CURRICULUM_COURSES
    const groups = new Map<
      string,
      {
        name: string
        courseCount: number
        courses?: Array<Record<string, unknown>>
      }
    >()
    for (const { groupName, averageWorkload, reviewCount, ...course } of rows) {
      let group = groups.get(groupName)
      if (!group) {
        group = {
          name: groupName,
          courseCount: 0,
          ...(coursesIncluded ? { courses: [] } : {})
        }
        groups.set(groupName, group)
      }
      group.courseCount += 1
      group.courses?.push({
        ...course,
        reviewCount: reviewCount ?? 0,
        workloadLabel: workloadLabel(averageWorkload),
        pageUrl: courseUrl(course.courseId)
      })
    }

    return {
      ...degree,
      groupNameFilter: args.groupName ?? null,
      groups: [...groups.values()],
      ...(coursesIncluded
        ? {}
        : {
            note: `Too many courses to list (${rows.length}). Call again with groupName to get the courses of one group.`
          })
    }
  }

  /**
   * One degree plus its curriculum.
   *
   * `curriculumYear` narrows to a single year, which is both what most questions
   * actually want and a large token saving: a 60-course master's plan is a lot of
   * context to spend answering about one year.
   */
  async getDegree(args: { degreeId: number; curriculumYear?: number }) {
    const [degree] = await database()
      .select({
        degreeId: degrees.id,
        name: degrees.name,
        acronym: degrees.acronym,
        type: degrees.type,
        description: degrees.description,
        facultyName: faculties.name,
        facultyShortName: faculties.shortName,
        courseCount: degreeStats.courseCount,
        reviewCount: degreeStats.feedbackCount,
        pageUrl: sql<string>`${SITE_URL} || '/' || ${faculties.slug} || '/' || ${degrees.slug}`
      })
      .from(degrees)
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .leftJoin(degreeStats, eq(degreeStats.degreeId, degrees.id))
      .where(eq(degrees.id, args.degreeId))
      .limit(1)

    if (!degree) return null

    const curriculum = await database()
      .select({
        courseId: courses.id,
        name: courses.name,
        acronym: courses.acronym,
        ects: courses.ects,
        isMandatory: courses.isMandatory,
        hasMandatoryExam: courses.hasMandatoryExam,
        curriculumYear: courseOfferings.curriculumYear,
        term: academicTerms.name,
        averageRating: courseStats.averageRating,
        averageWorkload: courseStats.averageWorkload,
        reviewCount: courseStats.totalFeedbackCount,
        pageUrl: sql<string>`${SITE_URL} || '/cadeiras/' || ${courses.id}`
      })
      .from(courses)
      .leftJoin(courseOfferings, eq(courseOfferings.courseId, courses.id))
      .leftJoin(
        academicTerms,
        eq(courseOfferings.academicTermId, academicTerms.id)
      )
      .leftJoin(courseStats, eq(courseStats.courseId, courses.id))
      // The curriculum is what a student can take: discontinued courses are
      // left out (search_courses still finds them)
      .where(
        args.curriculumYear === undefined
          ? and(
              eq(courses.degreeId, args.degreeId),
              isNull(courses.lastTaughtYear)
            )
          : and(
              eq(courses.degreeId, args.degreeId),
              isNull(courses.lastTaughtYear),
              eq(courseOfferings.curriculumYear, args.curriculumYear)
            )
      )
      .orderBy(asc(courseOfferings.curriculumYear), asc(courses.name))
      .limit(MAX_CURRICULUM_COURSES)

    // The query returns one row per offering, so a course taught in both
    // semesters came back twice, at full size, and read as two courses. One row
    // per course, with every year and term it runs in.
    const byCourse = new Map<
      number,
      Omit<(typeof curriculum)[number], 'curriculumYear' | 'term'> & {
        curriculumYears: number[]
        terms: string[]
      }
    >()
    for (const { curriculumYear, term, ...course } of curriculum) {
      let row = byCourse.get(course.courseId)
      if (!row) {
        row = { ...course, curriculumYears: [], terms: [] }
        byCourse.set(course.courseId, row)
      }
      if (
        curriculumYear !== null &&
        !row.curriculumYears.includes(curriculumYear)
      )
        row.curriculumYears.push(curriculumYear)
      if (term !== null && !row.terms.includes(term)) row.terms.push(term)
    }

    // The degree's course groups (MEIC specializations, MEEC areas, FLUL
    // majors and minors). Listed in full even when the curriculum is narrowed
    // to one year, so "which specializations are there" never needs the plan.
    const memberships = await database()
      .select({
        name: courseGroup.name,
        courseId: courseGroupsCourses.courseId
      })
      .from(courseGroup)
      .innerJoin(
        courseGroupsCourses,
        eq(courseGroupsCourses.courseGroupId, courseGroup.id)
      )
      .where(eq(courseGroup.degreeId, args.degreeId))
      .orderBy(asc(courseGroup.name))
    const groupSizes = new Map<string, number>()
    const groupsByCourse = new Map<number, string[]>()
    for (const { name, courseId } of memberships) {
      groupSizes.set(name, (groupSizes.get(name) ?? 0) + 1)
      groupsByCourse.set(courseId, [
        ...(groupsByCourse.get(courseId) ?? []),
        name
      ])
    }

    return {
      ...degree,
      description: truncate(degree.description, MAX_TEXT_FIELD_CHARS),
      curriculumYearFilter: args.curriculumYear ?? null,
      courseGroups: [...groupSizes].map(([name, courseCount]) => ({
        name,
        courseCount
      })),
      curriculum: [...byCourse.values()].map((c) => ({
        ...c,
        groups: groupsByCourse.get(c.courseId) ?? [],
        reviewCount: c.reviewCount ?? 0,
        workloadLabel: workloadLabel(c.averageWorkload)
      }))
    }
  }
}
