import { database, schema } from '@uni-feedback/db'
import { asc } from 'drizzle-orm'

/**
 * The footer's site directory: every university with its faculties. It renders
 * on every page from the root loader, so it is cached in memory; universities
 * and faculties change a few times a year, and a restart picks a change up
 * sooner than the TTL anyway.
 */

export interface FooterDirectoryUniversity {
  slug: string
  shortName: string
  faculties: { slug: string; shortName: string }[]
}

const TTL_MS = 10 * 60 * 1000

let cache: { at: number; data: FooterDirectoryUniversity[] } | null = null

export async function loadFooterDirectory(): Promise<
  FooterDirectoryUniversity[]
> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data
  try {
    const db = database()
    const [universities, faculties] = await Promise.all([
      db
        .select({
          id: schema.universities.id,
          slug: schema.universities.slug,
          shortName: schema.universities.shortName
        })
        .from(schema.universities)
        .orderBy(asc(schema.universities.id)),
      db
        .select({
          universityId: schema.faculties.universityId,
          slug: schema.faculties.slug,
          shortName: schema.faculties.shortName
        })
        .from(schema.faculties)
        .orderBy(asc(schema.faculties.shortName))
    ])
    const data = universities
      .map((u) => ({
        slug: u.slug,
        shortName: u.shortName,
        faculties: faculties
          .filter((f) => f.universityId === u.id && f.slug)
          .map((f) => ({ slug: f.slug!, shortName: f.shortName }))
      }))
      .filter((u) => u.faculties.length > 0)
    cache = { at: Date.now(), data }
    return data
  } catch (error) {
    // The footer is chrome: a failed lookup must not fail the page. Serve the
    // last good copy if there is one, otherwise no directory.
    console.error('Failed to load footer directory', error)
    return cache?.data ?? []
  }
}
