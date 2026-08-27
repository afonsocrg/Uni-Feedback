import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApprovedFeedback,
  createCourse,
  createDegree,
  createFaculty,
  initCourseStats,
  initDegreeStats
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import { ChatContextService, estimateTokens } from '../chatContextService'

describe('ChatContextService', () => {
  let service: ChatContextService

  beforeEach(async () => {
    await cleanAllTables()
    service = new ChatContextService()
  })

  async function seed(courseData?: { description?: string }) {
    const faculty = await createFaculty({
      name: 'Instituto Superior Técnico',
      shortName: 'IST',
      slug: 'ist'
    })
    const degree = await createDegree(faculty.id, {
      name: 'Licenciatura em Engenharia Informática e de Computadores',
      acronym: 'LEIC',
      slug: 'leic',
      description: 'Um curso de engenharia informática.'
    })
    await initDegreeStats(degree.id, 1)
    const course = await createCourse(degree.id, {
      name: 'Análise e Modelação de Sistemas',
      acronym: 'AMS',
      ects: 6,
      description:
        courseData?.description ?? 'Modelação de sistemas de software.'
    })
    await initCourseStats(course.id)
    return { faculty, degree, course }
  }

  it('returns nothing for an unscoped chat', async () => {
    await withTestDb(async () => {
      const context = await service.build({})
      expect(context.markdown).toBe('')
      expect(context.entities).toHaveLength(0)
    })
  })

  describe('course scope', () => {
    it('names the course, its degree, its university and its id', async () => {
      await withTestDb(async () => {
        const { course } = await seed()
        const context = await service.build({ courseId: course.id })

        expect(context.markdown).toContain('Análise e Modelação de Sistemas')
        expect(context.markdown).toContain('LEIC')
        expect(context.markdown).toContain('IST')
        expect(context.markdown).toContain('ECTS: 6')
        // The id is the point: with it the model skips a search entirely, which
        // is where most of the Phase 0 ambiguity failures happened.
        expect(context.markdown).toContain(
          `course_id for the tools: ${course.id}`
        )
        expect(context.markdown).toContain(
          `https://uni-feedback.com/cadeiras/${course.id}`
        )
      })
    })

    it('links the course, its degree and its faculty as entities', async () => {
      await withTestDb(async () => {
        const { faculty, degree, course } = await seed()
        const context = await service.build({ courseId: course.id })

        expect(context.entities).toEqual(
          expect.arrayContaining([
            { type: 'course', id: course.id },
            { type: 'degree', id: degree.id },
            { type: 'faculty', id: faculty.id }
          ])
        )
      })
    })

    it('reports how much opinion evidence exists', async () => {
      await withTestDb(async () => {
        const { course } = await seed()
        await createApprovedFeedback(course.id, {
          rating: 4,
          comment: 'Bom projeto.'
        })
        await createApprovedFeedback(course.id, { rating: 2, comment: null })

        const context = await service.build({ courseId: course.id })
        // Two reviews, one with a comment. The model needs both numbers to pitch
        // its confidence honestly.
        expect(context.markdown).toContain('1 with a written comment')
      })
    })

    it('falls back to an unscoped chat when the course is gone', async () => {
      await withTestDb(async () => {
        const context = await service.build({ courseId: 999999 })
        // A stale scope is not worth failing a conversation over.
        expect(context.markdown).toBe('')
      })
    })
  })

  describe('degree scope', () => {
    it('names the degree and its id, without inlining the curriculum', async () => {
      await withTestDb(async () => {
        const { degree } = await seed()
        const context = await service.build({ degreeId: degree.id })

        expect(context.markdown).toContain('LEIC')
        expect(context.markdown).toContain(
          `degree_id for the tools: ${degree.id}`
        )
        // A master's plan is 60 courses. Inlining it would be paid for on every
        // turn, so the block points at get_degree instead.
        expect(context.markdown).not.toContain(
          'Análise e Modelação de Sistemas'
        )
        expect(context.markdown).toContain('curriculum_year')
      })
    })
  })

  describe('faculty scope', () => {
    it('tells the model which faculty string to search with', async () => {
      await withTestDb(async () => {
        const { faculty } = await seed()
        const context = await service.build({ facultyId: faculty.id })

        expect(context.markdown).toContain('Instituto Superior Técnico')
        expect(context.entities).toEqual([{ type: 'faculty', id: faculty.id }])
        // Handing it the exact stored short name sidesteps the "FCT" vs
        // "Nova FCT" class of miss entirely.
        expect(context.markdown).toContain('Pass "IST" as the faculty')
      })
    })
  })

  describe('token budget', () => {
    it('stays within budget when the description is enormous', async () => {
      await withTestDb(async () => {
        const { course } = await seed({ description: 'a'.repeat(20000) })
        const context = await service.build({ courseId: course.id })

        // This block is prepended to EVERY turn, so an unbounded description
        // would be paid for on every message of the conversation.
        expect(context.estimatedTokens).toBeLessThanOrEqual(700)
        // Two caps apply and the retrieval one bites first, but either way the
        // caller is told the description shown is not the whole thing.
        expect(context.truncated).toBe(true)
        expect(context.markdown).toContain('…')
      })
    })

    it('keeps the identity lines even when the description is dropped', async () => {
      await withTestDb(async () => {
        const { course } = await seed({ description: 'b'.repeat(20000) })
        const context = await service.build({ courseId: course.id })

        // The elastic part is the description. What makes the context useful at
        // all (name, ids, links) is never sacrificed to fit.
        expect(context.markdown).toContain('Análise e Modelação de Sistemas')
        expect(context.markdown).toContain(
          `course_id for the tools: ${course.id}`
        )
      })
    })

    it('nests the description headings under the block, not alongside it', async () => {
      await withTestDb(async () => {
        // Real course descriptions are scraped markdown that opens with its own
        // `## Objetivos` / `## Programa`. Left alone, those sit level with the
        // block's own `## Conversation context` and the description escapes the
        // section it belongs to.
        const { course } = await seed({
          description:
            '## Objetivos\n\nModelar sistemas.\n\n## Programa\n\nUML.'
        })
        const context = await service.build({ courseId: course.id })

        expect(context.markdown).toContain('#### Objetivos')
        expect(context.markdown).toContain('#### Programa')
        expect(context.markdown).not.toContain('\n## Objetivos')
        // Exactly one top-level heading in the block: its own.
        const topLevel = context.markdown
          .split('\n')
          .filter((l) => /^##\s/.test(l))
        expect(topLevel).toEqual(['## Conversation context'])
      })
    })

    it('keeps a short description intact', async () => {
      await withTestDb(async () => {
        const { course } = await seed({
          description: 'Modelação de sistemas de software.'
        })
        const context = await service.build({ courseId: course.id })

        expect(context.markdown).toContain('Modelação de sistemas de software.')
        expect(context.truncated).toBe(false)
      })
    })
  })

  describe('estimateTokens', () => {
    it('approximates four characters per token', () => {
      expect(estimateTokens('')).toBe(0)
      expect(estimateTokens('abcd')).toBe(1)
      expect(estimateTokens('a'.repeat(400))).toBe(100)
    })
  })
})
