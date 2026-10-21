import {
  findDegreeSlugRedirect,
  findFacultySlugRedirect,
  schema
} from '@uni-feedback/db'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDegree, createFaculty } from '../../test/helpers'
import { cleanAllTables, getTestDb, withTestDb } from '../../test/setup'

/**
 * Slug redirects (migration 0046): renaming a faculty or degree slug records
 * the old one, and the website's loaders resolve it to the current URL.
 */
describe('Slug redirects', () => {
  beforeEach(async () => {
    await cleanAllTables()
  })

  function renameDegree(id: number, slug: string) {
    return getTestDb()
      .update(schema.degrees)
      .set({ slug })
      .where(eq(schema.degrees.id, id))
  }

  function renameFaculty(id: number, slug: string) {
    return getTestDb()
      .update(schema.faculties)
      .set({ slug })
      .where(eq(schema.faculties.id, id))
  }

  it('resolves a renamed degree', async () => {
    await withTestDb(async () => {
      const ist = await createFaculty({ slug: 'ist' })
      const leno = await createDegree(ist.id, { slug: 'lean' })
      await renameDegree(leno.id, 'leno')

      expect(await findDegreeSlugRedirect('ist', 'lean')).toEqual({
        facultySlug: 'ist',
        degreeSlug: 'leno'
      })
      expect(await findDegreeSlugRedirect('ist', 'leno')).toBeNull()
      expect(await findDegreeSlugRedirect('ist', 'nope')).toBeNull()
    })
  })

  it('scopes degree slugs to their faculty', async () => {
    await withTestDb(async () => {
      const ist = await createFaculty({ slug: 'ist' })
      await createFaculty({ slug: 'fct' })
      const degree = await createDegree(ist.id, { slug: 'lean' })
      await renameDegree(degree.id, 'leno')

      expect(await findDegreeSlugRedirect('fct', 'lean')).toBeNull()
    })
  })

  it('follows a chain of renames in one hop', async () => {
    await withTestDb(async () => {
      const ist = await createFaculty({ slug: 'ist' })
      const degree = await createDegree(ist.id, { slug: 'a' })
      await renameDegree(degree.id, 'b')
      await renameDegree(degree.id, 'c')

      expect(await findDegreeSlugRedirect('ist', 'a')).toEqual({
        facultySlug: 'ist',
        degreeSlug: 'c'
      })
      expect(await findDegreeSlugRedirect('ist', 'b')).toEqual({
        facultySlug: 'ist',
        degreeSlug: 'c'
      })
    })
  })

  it('drops the redirect when a live degree takes the slug back', async () => {
    await withTestDb(async () => {
      const ist = await createFaculty({ slug: 'ist' })
      const degree = await createDegree(ist.id, { slug: 'lean' })
      await renameDegree(degree.id, 'leno')
      // A new degree reuses the old slug: the live one wins
      await createDegree(ist.id, { slug: 'lean', acronym: 'LEAN' })

      expect(await findDegreeSlugRedirect('ist', 'lean')).toBeNull()
      const rows = await getTestDb()
        .select()
        .from(schema.degreeSlugRedirects)
        .where(eq(schema.degreeSlugRedirects.oldSlug, 'lean'))
      expect(rows).toHaveLength(0)
    })
  })

  it('resolves a renamed faculty, alone and with a renamed degree', async () => {
    await withTestDb(async () => {
      const faculty = await createFaculty({ slug: 'old-fac' })
      const degree = await createDegree(faculty.id, { slug: 'old-deg' })
      await renameFaculty(faculty.id, 'new-fac')

      expect(await findFacultySlugRedirect('old-fac')).toBe('new-fac')
      expect(await findFacultySlugRedirect('new-fac')).toBeNull()
      expect(await findDegreeSlugRedirect('old-fac', 'old-deg')).toEqual({
        facultySlug: 'new-fac',
        degreeSlug: 'old-deg'
      })

      await renameDegree(degree.id, 'new-deg')
      expect(await findDegreeSlugRedirect('old-fac', 'old-deg')).toEqual({
        facultySlug: 'new-fac',
        degreeSlug: 'new-deg'
      })
    })
  })

  it('follows a degree that moved to another faculty', async () => {
    await withTestDb(async () => {
      const a = await createFaculty({ slug: 'a' })
      const b = await createFaculty({ slug: 'b' })
      const degree = await createDegree(a.id, { slug: 'deg' })
      await getTestDb()
        .update(schema.degrees)
        .set({ facultyId: b.id })
        .where(eq(schema.degrees.id, degree.id))

      expect(await findDegreeSlugRedirect('a', 'deg')).toEqual({
        facultySlug: 'b',
        degreeSlug: 'deg'
      })
    })
  })
})
