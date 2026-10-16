import {
  AlreadyExistsError,
  BadRequestError,
  NotFoundError
} from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import {
  courseOfferings,
  courses,
  degrees,
  faculties,
  feedback,
  userDegrees,
  users
} from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { and, asc, desc, eq, isNotNull, min, sql } from 'drizzle-orm'

/**
 * "O meu percurso": the degrees a student takes or took.
 *
 * Two sources, deliberately kept apart:
 *
 * - **Declared** degrees are rows in `user_degrees`, written only when the
 *   student confirms or enters one.
 * - **The inferred** degree is a single guess computed from their approved
 *   reviews and never stored. It is offered at most once: any answer sets
 *   `users.degree_inference_resolved_at`, and it is only offered while the
 *   student has no declared degree at all.
 *
 * Plan: afonsocrg/todo.md, "O meu percurso" v1.
 */

/** Earliest school year a student can claim. Older than any degree we list. */
const MIN_SCHOOL_YEAR = 1980

export interface JourneyDegree {
  /** `user_degrees.id`, or null for the inferred guess. */
  id: number | null
  degreeId: number
  degreeName: string
  degreeAcronym: string
  degreeType: string
  facultyId: number
  facultyName: string
  facultyShortName: string
  facultyLogo: string | null
  startSchoolYear: number | null
  endSchoolYear: number | null
}

export interface Journey {
  degrees: JourneyDegree[]
  inferred: JourneyDegree | null
}

export interface DegreeInput {
  degreeId: number
  startSchoolYear?: number | null
  endSchoolYear?: number | null
}

const degreeColumns = {
  degreeId: degrees.id,
  degreeName: degrees.name,
  degreeAcronym: degrees.acronym,
  degreeType: degrees.type,
  facultyId: faculties.id,
  facultyName: faculties.name,
  facultyShortName: faculties.shortName,
  facultyLogo: faculties.logo
}

export class UserDegreeService {
  async getJourney(userId: number): Promise<Journey> {
    const declared = await this.listDegrees(userId)
    const inferred =
      declared.length === 0 ? await this.inferDegree(userId) : null
    return { degrees: declared, inferred }
  }

  /**
   * Declared degrees, current first.
   *
   * "Current" is an ongoing degree (no end year), and among those the most
   * recent start. That is the order the chat reads them in, so the first row is
   * what "o meu curso" means.
   */
  async listDegrees(userId: number): Promise<JourneyDegree[]> {
    return database()
      .select({
        id: userDegrees.id,
        ...degreeColumns,
        startSchoolYear: userDegrees.startSchoolYear,
        endSchoolYear: userDegrees.endSchoolYear
      })
      .from(userDegrees)
      .innerJoin(degrees, eq(userDegrees.degreeId, degrees.id))
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .where(eq(userDegrees.userId, userId))
      .orderBy(
        sql`${userDegrees.endSchoolYear} IS NOT NULL`,
        desc(
          sql`coalesce(${userDegrees.endSchoolYear}, ${userDegrees.startSchoolYear})`
        ),
        desc(userDegrees.startSchoolYear),
        asc(userDegrees.id)
      )
  }

  /**
   * The one guess, or null when there is nothing to offer.
   *
   * Picks the degree with the most reviews **in the student's most recent
   * reviewed school year**, so a LEIC graduate now reviewing MEIC courses lands
   * on MEIC rather than on the degree with more reviews overall. Ties fall back
   * to all-time count.
   *
   * The start year is estimated, not just "the first year they reviewed": most
   * reviews come from later-year students, so a review of a 3rd-year course in
   * 2024/2025 implies starting around 2022/2023. Each review gives
   * `school_year - (curriculum_year - 1)` and the earliest wins.
   */
  async inferDegree(userId: number): Promise<JourneyDegree | null> {
    const [user] = await database()
      .select({ resolvedAt: users.degreeInferenceResolvedAt })
      .from(users)
      .where(eq(users.id, userId))
    if (!user || user.resolvedAt) return null

    const rows = await database()
      .select({
        degreeId: courses.degreeId,
        schoolYear: feedback.schoolYear,
        curriculumYear: min(courseOfferings.curriculumYear)
      })
      .from(feedback)
      .innerJoin(courses, eq(feedback.courseId, courses.id))
      .leftJoin(courseOfferings, eq(courseOfferings.courseId, courses.id))
      .where(and(eq(feedback.userId, userId), isNotNull(feedback.approvedAt)))
      .groupBy(feedback.id, courses.degreeId, feedback.schoolYear)

    const reviews = rows.filter(
      (r): r is typeof r & { degreeId: number } => r.degreeId !== null
    )
    if (reviews.length === 0) return null

    const latestYear = Math.max(
      ...reviews.map((r) => r.schoolYear ?? -Infinity)
    )
    const tally = new Map<number, { recent: number; total: number }>()
    for (const r of reviews) {
      const t = tally.get(r.degreeId) ?? { recent: 0, total: 0 }
      t.total += 1
      if (r.schoolYear === latestYear) t.recent += 1
      tally.set(r.degreeId, t)
    }
    const [degreeId] = [...tally.entries()].sort(
      ([idA, a], [idB, b]) =>
        b.recent - a.recent || b.total - a.total || idA - idB
    )[0]

    const estimates = reviews
      .filter((r) => r.degreeId === degreeId && r.schoolYear !== null)
      .map((r) => (r.schoolYear as number) - ((r.curriculumYear ?? 1) - 1))
    const startSchoolYear =
      estimates.length > 0
        ? Math.max(MIN_SCHOOL_YEAR, Math.min(...estimates))
        : null

    const degree = await this.findDegree(degreeId)
    if (!degree) return null
    return { id: null, ...degree, startSchoolYear, endSchoolYear: null }
  }

  async addDegree(userId: number, input: DegreeInput): Promise<JourneyDegree> {
    const years = validateYears(input)
    const degree = await this.findDegree(input.degreeId)
    if (!degree) throw new NotFoundError('Degree not found')

    const inserted = await database()
      .insert(userDegrees)
      .values({ userId, degreeId: input.degreeId, ...years })
      .onConflictDoNothing()
      .returning({ id: userDegrees.id })
    if (inserted.length === 0) {
      throw new AlreadyExistsError('Degree already in your profile')
    }

    // Saving any degree answers the guess: confirming it, or replacing it.
    await this.resolveInference(userId)
    return { id: inserted[0].id, ...degree, ...years }
  }

  async updateDegree(
    userId: number,
    id: number,
    input: DegreeInput
  ): Promise<JourneyDegree> {
    const years = validateYears(input)
    const degree = await this.findDegree(input.degreeId)
    if (!degree) throw new NotFoundError('Degree not found')

    const duplicate = await database()
      .select({ id: userDegrees.id })
      .from(userDegrees)
      .where(
        and(
          eq(userDegrees.userId, userId),
          eq(userDegrees.degreeId, input.degreeId)
        )
      )
    if (duplicate.some((d) => d.id !== id)) {
      throw new AlreadyExistsError('Degree already in your profile')
    }

    const updated = await database()
      .update(userDegrees)
      .set({ degreeId: input.degreeId, ...years, updatedAt: new Date() })
      .where(and(eq(userDegrees.id, id), eq(userDegrees.userId, userId)))
      .returning({ id: userDegrees.id })
    if (updated.length === 0) {
      throw new NotFoundError('Degree not found in your profile')
    }
    return { id, ...degree, ...years }
  }

  async removeDegree(userId: number, id: number): Promise<void> {
    const deleted = await database()
      .delete(userDegrees)
      .where(and(eq(userDegrees.id, id), eq(userDegrees.userId, userId)))
      .returning({ id: userDegrees.id })
    if (deleted.length === 0) {
      throw new NotFoundError('Degree not found in your profile')
    }
  }

  /** "Não é o meu curso", or any other answer to the guess. Idempotent. */
  async resolveInference(userId: number): Promise<void> {
    await database()
      .update(users)
      .set({ degreeInferenceResolvedAt: new Date() })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.degreeInferenceResolvedAt} IS NULL`
        )
      )
  }

  private async findDegree(degreeId: number) {
    const [degree] = await database()
      .select(degreeColumns)
      .from(degrees)
      .innerJoin(faculties, eq(degrees.facultyId, faculties.id))
      .where(eq(degrees.id, degreeId))
    return degree ?? null
  }
}

/**
 * Both years optional; when given, they must be real past-or-present school
 * years in order. The end year is the last year enrolled, so it cannot be in
 * the future: an expected graduation is a guess that goes stale.
 */
function validateYears(input: DegreeInput): {
  startSchoolYear: number | null
  endSchoolYear: number | null
} {
  const start = input.startSchoolYear ?? null
  const end = input.endSchoolYear ?? null
  const current = getCurrentSchoolYear()

  for (const year of [start, end]) {
    if (year === null) continue
    if (!Number.isInteger(year) || year < MIN_SCHOOL_YEAR || year > current) {
      throw new BadRequestError('Invalid school year')
    }
  }
  if (start !== null && end !== null && end < start) {
    throw new BadRequestError('End year is before start year')
  }
  return { startSchoolYear: start, endSchoolYear: end }
}
