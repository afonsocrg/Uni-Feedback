import { and, eq } from 'drizzle-orm'
import { database } from '../context'
import {
  degreeSlugRedirects,
  degrees,
  faculties,
  facultySlugRedirects
} from '../schema'

/**
 * Current slug of the faculty an old slug used to belong to, or null when the
 * slug was never renamed. Only call it after the live lookup failed: a live
 * slug always wins (migration 0046).
 */
export async function findFacultySlugRedirect(
  oldSlug: string
): Promise<string | null> {
  const [row] = await database()
    .select({ slug: faculties.slug })
    .from(facultySlugRedirects)
    .innerJoin(faculties, eq(faculties.id, facultySlugRedirects.facultyId))
    .where(eq(facultySlugRedirects.oldSlug, oldSlug))
    .limit(1)
  return row?.slug ?? null
}

/**
 * Current (faculty, degree) slugs for a degree URL with an old faculty slug, an
 * old degree slug, or both. Null when the URL is already current or nothing
 * matches. The degree may have moved faculty, so the faculty slug comes from
 * the degree's own faculty, not from the URL.
 */
export async function findDegreeSlugRedirect(
  facultySlug: string,
  degreeSlug: string
): Promise<{ facultySlug: string; degreeSlug: string } | null> {
  const db = database()

  const [liveFaculty] = await db
    .select({ id: faculties.id })
    .from(faculties)
    .where(eq(faculties.slug, facultySlug))
    .limit(1)
  const [redirectedFaculty] = liveFaculty
    ? []
    : await db
        .select({ id: facultySlugRedirects.facultyId })
        .from(facultySlugRedirects)
        .where(eq(facultySlugRedirects.oldSlug, facultySlug))
        .limit(1)
  const facultyId = liveFaculty?.id ?? redirectedFaculty?.id
  if (facultyId == null) return null

  const [liveDegree] = await db
    .select({ id: degrees.id })
    .from(degrees)
    .where(and(eq(degrees.facultyId, facultyId), eq(degrees.slug, degreeSlug)))
    .limit(1)
  const [redirectedDegree] = liveDegree
    ? []
    : await db
        .select({ id: degreeSlugRedirects.degreeId })
        .from(degreeSlugRedirects)
        .where(
          and(
            eq(degreeSlugRedirects.facultyId, facultyId),
            eq(degreeSlugRedirects.oldSlug, degreeSlug)
          )
        )
        .limit(1)
  const degreeId = liveDegree?.id ?? redirectedDegree?.id
  if (degreeId == null) return null

  const [target] = await db
    .select({ facultySlug: faculties.slug, degreeSlug: degrees.slug })
    .from(degrees)
    .innerJoin(faculties, eq(faculties.id, degrees.facultyId))
    .where(eq(degrees.id, degreeId))
    .limit(1)
  if (!target?.facultySlug || !target.degreeSlug) return null
  if (target.facultySlug === facultySlug && target.degreeSlug === degreeSlug) {
    return null
  }
  return { facultySlug: target.facultySlug, degreeSlug: target.degreeSlug }
}
