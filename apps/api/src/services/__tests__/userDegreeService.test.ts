import { database } from '@uni-feedback/db'
import {
  academicTerms,
  courseOfferings,
  userDegrees,
  users
} from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApprovedFeedback,
  createCourse,
  createDegree,
  createFaculty,
  createUnapprovedFeedback,
  createUser
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import { UserDegreeService } from '../userDegreeService'

/**
 * "O meu percurso": declared degrees and the one-time guess.
 *
 * The rule most worth protecting is "we guess once". A guess that comes back
 * after the student said no, or after they removed their degrees, reads as the
 * product not listening.
 */
describe('UserDegreeService', () => {
  let service: UserDegreeService

  beforeEach(async () => {
    await cleanAllTables()
    service = new UserDegreeService()
  })

  async function seed() {
    const ist = await createFaculty({
      name: 'Instituto Superior Técnico',
      shortName: 'IST',
      slug: 'ist'
    })
    const leic = await createDegree(ist.id, {
      name: 'LEIC',
      acronym: 'LEIC',
      slug: 'leic'
    })
    const meic = await createDegree(ist.id, {
      name: 'MEIC',
      acronym: 'MEIC',
      slug: 'meic',
      type: 'master'
    })
    const leicCourse = await createCourse(leic.id, { name: 'IAC', slug: 'iac' })
    const leicCourse2 = await createCourse(leic.id, {
      name: 'AMS',
      slug: 'ams'
    })
    const meicCourse = await createCourse(meic.id, {
      name: 'ADSI',
      slug: 'adsi'
    })
    const user = await createUser()
    return { ist, leic, meic, leicCourse, leicCourse2, meicCourse, user }
  }

  describe('the inferred guess', () => {
    it('picks the degree of the most recent school year, not the one with most reviews', async () => {
      await withTestDb(async () => {
        const { meic, leicCourse, leicCourse2, meicCourse, user } = await seed()
        await createApprovedFeedback(leicCourse.id, {
          userId: user.id,
          schoolYear: 2022
        })
        await createApprovedFeedback(leicCourse2.id, {
          userId: user.id,
          schoolYear: 2023
        })
        await createApprovedFeedback(meicCourse.id, {
          userId: user.id,
          schoolYear: 2025
        })

        const journey = await service.getJourney(user.id)
        expect(journey.degrees).toEqual([])
        expect(journey.inferred).toMatchObject({
          id: null,
          degreeId: meic.id,
          degreeAcronym: 'MEIC',
          facultyShortName: 'IST',
          endSchoolYear: null
        })
      })
    })

    it('estimates the start year from the curriculum year of what they reviewed', async () => {
      await withTestDb(async () => {
        const { ist, leicCourse, user } = await seed()
        const [term] = await database()
          .insert(academicTerms)
          .values({
            facultyId: ist.id,
            name: '1st semester',
            startTick: 0,
            endTick: 1
          })
          .returning()
        await database().insert(courseOfferings).values({
          courseId: leicCourse.id,
          curriculumYear: 3,
          academicTermId: term.id
        })
        await createApprovedFeedback(leicCourse.id, {
          userId: user.id,
          schoolYear: 2024
        })

        const { inferred } = await service.getJourney(user.id)
        expect(inferred?.startSchoolYear).toBe(2022)
      })
    })

    it('ignores reviews that are not approved', async () => {
      await withTestDb(async () => {
        const { meicCourse, user } = await seed()
        await createUnapprovedFeedback(meicCourse.id, {
          userId: user.id,
          schoolYear: 2025
        })
        expect((await service.getJourney(user.id)).inferred).toBeNull()
      })
    })

    it('is offered once: dismissing it means it never comes back', async () => {
      await withTestDb(async () => {
        const { meicCourse, user } = await seed()
        await createApprovedFeedback(meicCourse.id, {
          userId: user.id,
          schoolYear: 2025
        })

        await service.resolveInference(user.id)
        expect((await service.getJourney(user.id)).inferred).toBeNull()
      })
    })

    it('does not come back after the student saves a degree and later removes it', async () => {
      await withTestDb(async () => {
        const { leic, meicCourse, user } = await seed()
        await createApprovedFeedback(meicCourse.id, {
          userId: user.id,
          schoolYear: 2025
        })

        const saved = await service.addDegree(user.id, { degreeId: leic.id })
        await service.removeDegree(user.id, saved.id as number)

        const journey = await service.getJourney(user.id)
        expect(journey.degrees).toEqual([])
        expect(journey.inferred).toBeNull()
      })
    })
  })

  describe('declared degrees', () => {
    it('lists the ongoing degree first, then finished ones by most recent', async () => {
      await withTestDb(async () => {
        const { leic, meic, user } = await seed()
        await service.addDegree(user.id, {
          degreeId: leic.id,
          startSchoolYear: 2022,
          endSchoolYear: 2024
        })
        await service.addDegree(user.id, {
          degreeId: meic.id,
          startSchoolYear: 2025
        })

        const { degrees } = await service.getJourney(user.id)
        expect(degrees.map((d) => d.degreeAcronym)).toEqual(['MEIC', 'LEIC'])
      })
    })

    it('rejects an end year before the start, or a year in the future', async () => {
      await withTestDb(async () => {
        const { leic, user } = await seed()
        await expect(
          service.addDegree(user.id, {
            degreeId: leic.id,
            startSchoolYear: 2024,
            endSchoolYear: 2022
          })
        ).rejects.toMatchObject({ statusCode: 400 })
        await expect(
          service.addDegree(user.id, {
            degreeId: leic.id,
            endSchoolYear: getCurrentSchoolYear() + 1
          })
        ).rejects.toMatchObject({ statusCode: 400 })
      })
    })

    it('refuses the same degree twice, on add and on edit', async () => {
      await withTestDb(async () => {
        const { leic, meic, user } = await seed()
        await service.addDegree(user.id, { degreeId: leic.id })
        const other = await service.addDegree(user.id, { degreeId: meic.id })

        await expect(
          service.addDegree(user.id, { degreeId: leic.id })
        ).rejects.toMatchObject({ statusCode: 409 })
        await expect(
          service.updateDegree(user.id, other.id as number, {
            degreeId: leic.id
          })
        ).rejects.toMatchObject({ statusCode: 409 })
      })
    })

    it("cannot touch another student's degree", async () => {
      await withTestDb(async () => {
        const { leic, user } = await seed()
        const intruder = await createUser()
        const saved = await service.addDegree(user.id, { degreeId: leic.id })

        await expect(
          service.updateDegree(intruder.id, saved.id as number, {
            degreeId: leic.id,
            startSchoolYear: 2020
          })
        ).rejects.toMatchObject({ statusCode: 404 })
        await expect(
          service.removeDegree(intruder.id, saved.id as number)
        ).rejects.toMatchObject({ statusCode: 404 })
        expect((await service.getJourney(user.id)).degrees).toHaveLength(1)
      })
    })

    it('is deleted with the account', async () => {
      await withTestDb(async () => {
        const { leic, user } = await seed()
        await service.addDegree(user.id, { degreeId: leic.id })
        await database().delete(users).where(eq(users.id, user.id))
        expect(await database().select().from(userDegrees)).toEqual([])
      })
    })
  })
})
