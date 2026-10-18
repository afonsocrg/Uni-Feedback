import { beforeEach, describe, expect, it } from 'vitest'
import {
  createCourse,
  createDegree,
  createFaculty,
  initCourseStats
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import { ChatRetrievalService } from '../chatRetrievalService'

/**
 * The lookups a turn makes most, kept small: one call answering several
 * keywords, and one row per course however many times it is offered.
 */
describe('ChatRetrievalService: batched and compact lookups', () => {
  let service: ChatRetrievalService

  beforeEach(async () => {
    await cleanAllTables()
    service = new ChatRetrievalService()
  })

  async function seed() {
    const ist = await createFaculty({
      name: 'Instituto Superior Técnico',
      shortName: 'IST',
      slug: 'ist'
    })
    const meec = await createDegree(ist.id, {
      name: 'Mestrado em Engenharia Electrotécnica e de Computadores',
      acronym: 'MEEC',
      slug: 'meec'
    })
    const controlo = await createCourse(meec.id, {
      name: 'Controlo Não Linear',
      acronym: 'CNL'
    })
    const robotica = await createCourse(meec.id, {
      name: 'Robótica e Controlo Inteligente',
      acronym: 'RCI'
    })
    const redes = await createCourse(meec.id, {
      name: 'Redes de Computadores',
      acronym: 'RC'
    })
    for (const c of [controlo, robotica, redes]) await initCourseStats(c.id)
    return { ist, meec, controlo, robotica, redes }
  }

  it('searches several terms in one call, each with its own match mode', async () => {
    await withTestDb(async () => {
      const { controlo, robotica } = await seed()

      const result = await service.searchCourses({
        queries: ['controlo', 'robótica', 'astronomia']
      })

      // Found by both terms, listed once.
      const rci = result.courses.find((c) => c.courseId === robotica.id)
      expect(rci && 'matchedQueries' in rci && rci.matchedQueries).toEqual([
        'controlo',
        'robótica'
      ])
      expect(result.courses.map((c) => c.courseId).sort()).toEqual(
        [controlo.id, robotica.id].sort()
      )
      // The term that found nothing is reported as such, not dropped.
      expect('queries' in result && result.queries).toContainEqual(
        expect.objectContaining({ query: 'astronomia', resultCount: 0 })
      )
    })
  })

  it('keeps the single-term shape when given one term', async () => {
    await withTestDb(async () => {
      await seed()
      const result = await service.searchCourses({ queries: ['redes'] })
      expect('matchMode' in result && result.matchMode).toBe('exact')
      expect(result.courses).toHaveLength(1)
    })
  })
})
