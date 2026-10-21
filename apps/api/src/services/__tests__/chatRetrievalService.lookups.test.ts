import {
  academicTerms,
  courseGradeStats,
  courseOfferings
} from '@uni-feedback/db/schema'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createCourse,
  createDegree,
  createFaculty,
  createIdenticalRelationship,
  initCourseStats,
  initDegreeStats
} from '../../../test/helpers'
import { cleanAllTables, getTestDb, withTestDb } from '../../../test/setup'
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

  it('returns one curriculum row per course, with every term it runs in', async () => {
    await withTestDb(async () => {
      const { ist, meec, redes } = await seed()
      const db = getTestDb()
      const terms = await db
        .insert(academicTerms)
        .values([
          { facultyId: ist.id, name: '1º Semestre', startTick: 0, endTick: 1 },
          { facultyId: ist.id, name: '2º Semestre', startTick: 2, endTick: 3 }
        ])
        .returning({ id: academicTerms.id })
      await db.insert(courseOfferings).values(
        terms.map((t) => ({
          courseId: redes.id,
          curriculumYear: 1,
          academicTermId: t.id
        }))
      )

      const degree = await service.getDegree({ degreeId: meec.id })

      const rows = degree!.curriculum.filter((c) => c.courseId === redes.id)
      expect(rows).toHaveLength(1)
      expect(rows[0].terms).toEqual(['1º Semestre', '2º Semestre'])
      expect(rows[0].curriculumYears).toEqual([1])
    })
  })

  it('tells the model a course is no longer taught, and keeps it off the curriculum', async () => {
    await withTestDb(async () => {
      const { meec } = await seed()
      const retired = await createCourse(meec.id, {
        name: 'Controlo Clássico',
        acronym: 'CC',
        lastTaughtYear: 2025
      })
      await initCourseStats(retired.id)

      const course = await service.getCourse(retired.id)
      expect(course?.lastTaughtSchoolYear).toBe('2025/2026')
      expect(course && 'lastTaughtYear' in course).toBe(false)

      // Search still finds it, flagged
      const result = await service.searchCourses({ queries: ['clássico'] })
      expect(result.courses[0]).toMatchObject({
        courseId: retired.id,
        lastTaughtSchoolYear: '2025/2026'
      })

      const degree = await service.getDegree({ degreeId: meec.id })
      const ids = degree!.curriculum.map((c) => c.courseId)
      expect(ids).not.toContain(retired.id)
      expect(ids).toHaveLength(3)
    })
  })

  it('counts faculties from degree_stats', async () => {
    await withTestDb(async () => {
      const { ist, meec } = await seed()
      await initDegreeStats(meec.id, 3)

      const [faculty] = await service.listFaculties()

      expect(faculty).toMatchObject({
        id: ist.id,
        degreeCount: 1,
        courseCount: 3,
        reviewCount: 0
      })
    })
  })

  it('reads grade averages across the identical set, newest first', async () => {
    await withTestDb(async () => {
      const { ist, controlo } = await seed()
      const other = await createDegree(ist.id, {
        name: 'Mestrado em Engenharia Aeroespacial',
        acronym: 'MEAer',
        slug: 'meaer'
      })
      const twin = await createCourse(other.id, {
        name: 'Controlo Não Linear',
        acronym: 'CNL'
      })
      await initCourseStats(twin.id)
      await createIdenticalRelationship(controlo.id, twin.id)
      await getTestDb()
        .insert(courseGradeStats)
        .values([
          { courseId: twin.id, schoolYear: 2023, averageGrade: 14.25 },
          { courseId: twin.id, schoolYear: 2024, averageGrade: 12 },
          // Same year on both rows: the course's own entry wins.
          { courseId: controlo.id, schoolYear: 2024, averageGrade: 15.8 }
        ])

      const course = await service.getCourse(controlo.id)
      expect(course?.gradeAverages).toEqual([
        { schoolYear: '2024/2025', averageGrade: 15.8 },
        { schoolYear: '2023/2024', averageGrade: 14.3 }
      ])
    })
  })
})
