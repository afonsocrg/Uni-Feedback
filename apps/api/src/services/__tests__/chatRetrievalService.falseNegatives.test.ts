import { beforeEach, describe, expect, it } from 'vitest'
import {
  createCourse,
  createDegree,
  createFaculty,
  createIdenticalRelationship,
  initCourseStats
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import { ChatRetrievalService } from '../chatRetrievalService'

/**
 * False-negative tests.
 *
 * The Phase 0 spike produced the same bug three times in three forms: a search
 * that found nothing for an entity we actually hold. Every time, the chat told a
 * student "we don't have that", which is indistinguishable from an honest answer
 * and sends them away.
 *
 *   run 1: "LEIC-A" against a stored "LEIC"          -> nothing
 *   run 1: faculty "FCT" against a stored "Nova FCT" -> nothing (491 reviews)
 *   run 5: faculty "FCT NOVA", same row, words swapped -> nothing again
 *
 * A wrong answer gets reported. A confident empty one does not. So this file is
 * table-driven over the variants students actually type, and any new variant that
 * turns up in the logs gets a row here rather than a one-off fix.
 */
describe('ChatRetrievalService: entity resolution must not report false negatives', () => {
  let service: ChatRetrievalService

  beforeEach(async () => {
    await cleanAllTables()
    service = new ChatRetrievalService()
  })

  /** A small slice of the real shape: two faculties, their degrees and courses. */
  async function seed() {
    const ist = await createFaculty({
      name: 'Instituto Superior Técnico',
      shortName: 'IST',
      slug: 'ist'
    })
    const fct = await createFaculty({
      name: 'Faculdade de Ciências e Tecnologia',
      shortName: 'Nova FCT',
      slug: 'nova-fct'
    })

    const leic = await createDegree(ist.id, {
      name: 'Licenciatura em Engenharia Informática e de Computadores',
      acronym: 'LEIC',
      slug: 'leic'
    })
    const lei = await createDegree(fct.id, {
      name: 'Licenciatura em Engenharia Informática',
      acronym: 'LEI',
      slug: 'lei'
    })

    const ams = await createCourse(leic.id, {
      name: 'Análise e Modelação de Sistemas',
      acronym: 'AMS'
    })
    await initCourseStats(ams.id)
    const fisica = await createCourse(leic.id, {
      name: 'Física I',
      acronym: 'F-I'
    })
    await initCourseStats(fisica.id)
    const progFct = await createCourse(lei.id, {
      name: 'Introdução à Programação',
      acronym: 'IP'
    })
    await initCourseStats(progFct.id)

    return { ist, fct, leic, lei, ams, fisica, progFct }
  }

  describe('faculty names, however the student writes them', () => {
    // The stored short name is "Nova FCT". Students write all of these.
    const facultyVariants = [
      'FCT',
      'FCT NOVA',
      'Nova FCT',
      'nova fct',
      'fct nova',
      'Ciências e Tecnologia',
      'ciencias e tecnologia' // no accents
    ]

    for (const variant of facultyVariants) {
      it(`resolves a degree at Nova FCT when the faculty is written "${variant}"`, async () => {
        await withTestDb(async () => {
          await seed()
          const result = await service.searchDegrees({
            query: 'Engenharia Informática',
            facultyName: variant
          })
          expect(result.resultCount).toBeGreaterThan(0)
          expect(result.degrees.map((d) => d.acronym)).toContain('LEI')
        })
      })
    }

    const istVariants = ['IST', 'ist', 'Técnico', 'tecnico', 'Superior Técnico']

    for (const variant of istVariants) {
      it(`resolves an IST course when the faculty is written "${variant}"`, async () => {
        await withTestDb(async () => {
          await seed()
          const result = await service.searchCourses({
            query: 'AMS',
            facultyName: variant
          })
          expect(result.resultCount).toBeGreaterThan(0)
          expect(result.courses[0].acronym).toBe('AMS')
        })
      })
    }

    it('does not match a faculty the student did not ask for', async () => {
      await withTestDb(async () => {
        await seed()
        const result = await service.searchCourses({
          query: 'AMS',
          facultyName: 'Nova FCT'
        })
        expect(result.resultCount).toBe(0)
      })
    })
  })

  describe('degree acronyms with suffixes we do not store', () => {
    // We store "LEIC". Students write the branch they are in.
    const degreeVariants = ['LEIC', 'LEIC-A', 'LEIC-T', 'leic-a']

    for (const variant of degreeVariants) {
      it(`resolves LEIC from "${variant}"`, async () => {
        await withTestDb(async () => {
          await seed()
          const result = await service.searchDegrees({ query: variant })
          expect(result.resultCount).toBeGreaterThan(0)
          expect(result.degrees[0].acronym).toBe('LEIC')
        })
      })
    }

    it('flags a relaxed match so the caller can hedge', async () => {
      await withTestDb(async () => {
        await seed()
        const exact = await service.searchDegrees({ query: 'LEIC' })
        expect(exact.matchMode).toBe('exact')

        // "LEIC-A" is not what we store, so the answer is an approximation and
        // the model must be told, or it presents a guess as a hit.
        const relaxed = await service.searchDegrees({ query: 'LEIC-A' })
        expect(relaxed.matchMode).toBe('relaxed')
        expect(relaxed.matchedTerm).toBe('LEIC')
      })
    })
  })

  describe('course names', () => {
    it('resolves an accented name typed without accents', async () => {
      await withTestDb(async () => {
        await seed()
        const result = await service.searchCourses({ query: 'Analise' })
        expect(result.courses.map((c) => c.acronym)).toContain('AMS')
      })
    })

    it('resolves a partial name', async () => {
      await withTestDb(async () => {
        await seed()
        const result = await service.searchCourses({ query: 'Modelação' })
        expect(result.courses.map((c) => c.acronym)).toContain('AMS')
      })
    })

    it('recovers a typo through trigram similarity', async () => {
      await withTestDb(async () => {
        await seed()
        // Neither substring nor token relaxation reaches this; only similarity does.
        const result = await service.searchCourses({ query: 'Fisica' })
        expect(result.resultCount).toBeGreaterThan(0)
        expect(result.courses.map((c) => c.acronym)).toContain('F-I')
      })
    })

    it('reports an honest zero for something we genuinely do not have', async () => {
      await withTestDb(async () => {
        await seed()
        const result = await service.searchCourses({
          query: 'Direito Constitucional'
        })
        expect(result.resultCount).toBe(0)
      })
    })
  })

  describe('identical courses are one course, not several', () => {
    it('collapses an identical set into a single result', async () => {
      await withTestDb(async () => {
        const { ist } = await seed()
        const bm = await createDegree(ist.id, {
          name: "Bachelor's in Management",
          acronym: 'BM',
          slug: 'bm'
        })
        const be = await createDegree(ist.id, {
          name: "Bachelor's in Economics",
          acronym: 'BE',
          slug: 'be'
        })
        const statsBm = await createCourse(bm.id, {
          name: 'Statistics for Economics and Management',
          acronym: 'SEM'
        })
        const statsBe = await createCourse(be.id, {
          name: 'Statistics for Economics and Management',
          acronym: 'SEM'
        })
        await initCourseStats(statsBm.id)
        await initCourseStats(statsBe.id)
        await createIdenticalRelationship(statsBm.id, statsBe.id)

        const result = await service.searchCourses({ query: 'Statistics' })

        // One course that two degrees share, not two courses.
        expect(result.resultCount).toBe(1)
        expect(result.courses[0].alsoInDegrees).toHaveLength(1)
      })
    })
  })

  describe('workload is reported on a scale that runs backwards', () => {
    it('labels a low workload number as heavy', async () => {
      await withTestDb(async () => {
        const { ams } = await seed()
        const service = new ChatRetrievalService()
        // 1 = very heavy, 5 = very light. A caller reading the raw number would
        // call this "light" and give the student the opposite of the truth.
        const course = await service.getCourse(ams.id)
        expect(course).not.toBeNull()
        expect(course?.workloadLabel).toBeNull() // no reviews yet

        const { workloadLabel } = await import('../chatRetrievalService')
        expect(workloadLabel(1)).toBe('very heavy')
        expect(workloadLabel(2)).toBe('heavy')
        expect(workloadLabel(5)).toBe('very light')
      })
    })
  })
})
