import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import {
  chatMessageEntities,
  chatMessageFeedback,
  chatMessages,
  chats
} from '@uni-feedback/db/schema'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createCourse,
  createDegree,
  createFaculty,
  createUser
} from '../../../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../../../test/setup'
import { GetChatDetails } from '../getChatDetails'
import { GetChats } from '../getChats'
import { GetChatStats } from '../getChatStats'

/**
 * The admin transcript reader. These run the real queries against the test
 * database because the list is mostly aggregation SQL, and aggregation SQL is
 * where a typo produces a plausible wrong number rather than an error.
 */
describe('Admin chat routes', () => {
  beforeEach(async () => {
    await cleanAllTables()
  })

  async function seed() {
    const db = database()
    const alice = await createUser({ email: 'alice@tecnico.ulisboa.pt' })
    const bob = await createUser({ email: 'bob@novasbe.pt' })
    const ist = await createFaculty({ shortName: 'IST' })
    const nova = await createFaculty({ shortName: 'Nova SBE' })
    const leic = await createDegree(ist.id, { acronym: 'LEIC-A' })
    const ams = await createCourse(leic.id, { acronym: 'AMS' })

    // Alice: scoped to a degree (no faculty id of its own), two turns, one
    // thumbs down with a comment, and a cited course.
    const [aliceChat] = await db
      .insert(chats)
      .values({
        userId: alice.id,
        title: 'AMS workload',
        language: 'pt',
        contextDegreeId: leic.id,
        contextSource: 'degree_page',
        lastMessageAt: new Date()
      })
      .returning()
    const [q1] = await db
      .insert(chatMessages)
      .values({
        chatId: aliceChat.id,
        seq: 1,
        role: 'user',
        content: 'AMS é muito pesada?'
      })
      .returning()
    const [a1] = await db
      .insert(chatMessages)
      .values({
        chatId: aliceChat.id,
        seq: 2,
        role: 'assistant',
        content: 'Sim, os alunos dizem que é pesada. [AMS](/courses/1)',
        model: 'test-model',
        inputTokens: 1000,
        outputTokens: 200,
        costMicros: 12000,
        latencyMs: 4000,
        metadata: {
          toolCalls: [
            { name: 'search_courses', args: { q: 'AMS' }, ms: 120 },
            { name: 'get_course_reviews', args: { courseId: ams.id }, ms: 80 }
          ],
          guardsFired: ['grounding'],
          hitIterationCap: false,
          gap: null
        }
      })
      .returning()
    await db.insert(chatMessageFeedback).values({
      messageId: a1.id,
      userId: alice.id,
      rating: 'not_helpful',
      comment: 'Não respondeu à pergunta'
    })
    await db.insert(chatMessageEntities).values([
      {
        messageId: a1.id,
        entityType: 'course',
        entityId: ams.id,
        relation: 'retrieved'
      },
      {
        messageId: a1.id,
        entityType: 'course',
        entityId: ams.id,
        relation: 'cited'
      }
    ])

    // Bob: cold start, one turn, soft-deleted, a gap recorded.
    const [bobChat] = await db
      .insert(chats)
      .values({
        userId: bob.id,
        language: 'en',
        contextFacultyId: nova.id,
        deletedAt: new Date(),
        lastMessageAt: new Date()
      })
      .returning()
    await db.insert(chatMessages).values([
      {
        chatId: bobChat.id,
        seq: 1,
        role: 'user',
        content: 'Is there any course about databases?'
      },
      {
        chatId: bobChat.id,
        seq: 2,
        role: 'assistant',
        content: 'I could not find one.',
        costMicros: 3000,
        latencyMs: 2000,
        metadata: {
          toolCalls: [{ name: 'search_courses', args: {}, ms: 50 }],
          guardsFired: [],
          hitIterationCap: true,
          gap: { kind: 'no_courses' }
        }
      }
    ])

    return { alice, bob, ist, nova, leic, ams, aliceChat, bobChat, q1, a1 }
  }

  function route<T extends { handle: () => Promise<Response> }>(
    Route: new (options: never) => T,
    data: Record<string, unknown>
  ): T {
    // OpenAPIRoute's constructor wants router options that no test needs.
    const handler = new Route(undefined as never)
    // @ts-expect-error - mocking protected method for testing
    handler.getValidatedData = async () => data
    return handler
  }

  const listQuery = (extra: Record<string, unknown> = {}) => ({
    query: { page: 1, limit: 20, ...extra }
  })

  describe('GET /admin/chats', () => {
    it('lists every chat with its aggregates, deleted ones included', async () => {
      await withTestDb(async () => {
        const { aliceChat, bobChat } = await seed()
        const response = await route(GetChats, listQuery()).handle()
        const body = await response.json()

        expect(body.total).toBe(2)
        const ids = body.data.map((c: { id: string }) => c.id)
        expect(ids).toContain(aliceChat.publicId)
        expect(ids).toContain(bobChat.publicId)

        const alice = body.data.find(
          (c: { id: string }) => c.id === aliceChat.publicId
        )
        expect(alice.userEmail).toBe('alice@tecnico.ulisboa.pt')
        expect(alice.firstQuestion).toBe('AMS é muito pesada?')
        expect(alice.messageCount).toBe(2)
        expect(alice.totalCostMicros).toBe(12000)
        expect(alice.notHelpfulCount).toBe(1)
        expect(alice.helpfulCount).toBe(0)
        expect(alice.context.degreeAcronym).toBe('LEIC-A')
        expect(alice.deletedAt).toBeNull()

        const bob = body.data.find(
          (c: { id: string }) => c.id === bobChat.publicId
        )
        expect(bob.title).toBeNull()
        expect(bob.deletedAt).not.toBeNull()
        expect(bob.context.facultyShortName).toBe('Nova SBE')
      })
    })

    it('filters by thumbs down, deletion, language and faculty through the degree', async () => {
      await withTestDb(async () => {
        const { aliceChat, bobChat, ist, nova } = await seed()

        const notHelpful = await (
          await route(GetChats, listQuery({ rating: 'not_helpful' })).handle()
        ).json()
        expect(notHelpful.data.map((c: { id: string }) => c.id)).toEqual([
          aliceChat.publicId
        ])

        const unrated = await (
          await route(GetChats, listQuery({ rating: 'none' })).handle()
        ).json()
        expect(unrated.data.map((c: { id: string }) => c.id)).toEqual([
          bobChat.publicId
        ])

        const deleted = await (
          await route(GetChats, listQuery({ deleted: true })).handle()
        ).json()
        expect(deleted.total).toBe(1)
        expect(deleted.data[0].id).toBe(bobChat.publicId)

        const english = await (
          await route(GetChats, listQuery({ language: 'en' })).handle()
        ).json()
        expect(english.total).toBe(1)

        // Alice's chat has no faculty id of its own; the degree carries it.
        const istOnly = await (
          await route(GetChats, listQuery({ faculty_id: ist.id })).handle()
        ).json()
        expect(istOnly.data.map((c: { id: string }) => c.id)).toEqual([
          aliceChat.publicId
        ])
        const novaOnly = await (
          await route(GetChats, listQuery({ faculty_id: nova.id })).handle()
        ).json()
        expect(novaOnly.data.map((c: { id: string }) => c.id)).toEqual([
          bobChat.publicId
        ])

        const byEmail = await (
          await route(GetChats, listQuery({ email: 'ALICE' })).handle()
        ).json()
        expect(byEmail.total).toBe(1)

        const random = await (
          await route(GetChats, listQuery({ sort: 'random' })).handle()
        ).json()
        expect(random.total).toBe(2)
      })
    })
  })

  describe('GET /admin/chats/:id', () => {
    it('returns the transcript with ratings, metadata, entities and totals', async () => {
      await withTestDb(async () => {
        const { aliceChat, ams } = await seed()
        const response = await route(GetChatDetails, {
          params: { id: aliceChat.publicId }
        }).handle()
        const body = await response.json()

        expect(body.id).toBe(aliceChat.publicId)
        expect(body.userEmail).toBe('alice@tecnico.ulisboa.pt')
        expect(body.context.degreeAcronym).toBe('LEIC-A')
        expect(body.context.facultyId).toBeNull()
        expect(body.totals).toEqual({
          messageCount: 2,
          costMicros: 12000,
          inputTokens: 1000,
          outputTokens: 200
        })

        expect(body.messages.map((m: { seq: number }) => m.seq)).toEqual([1, 2])
        const answer = body.messages[1]
        expect(answer.role).toBe('assistant')
        expect(answer.model).toBe('test-model')
        expect(answer.metadata.toolCalls).toHaveLength(2)
        expect(answer.metadata.guardsFired).toEqual(['grounding'])
        expect(answer.rating).toMatchObject({
          rating: 'not_helpful',
          comment: 'Não respondeu à pergunta'
        })
        expect(answer.entities).toHaveLength(2)
        const cited = answer.entities.find(
          (e: { relation: string }) => e.relation === 'cited'
        )
        expect(cited.id).toBe(ams.id)
        expect(cited.label).toContain('AMS')

        expect(body.messages[0].rating).toBeNull()
        expect(body.messages[0].entities).toEqual([])
      })
    })

    it('reads a soft-deleted chat', async () => {
      await withTestDb(async () => {
        const { bobChat } = await seed()
        const body = await (
          await route(GetChatDetails, {
            params: { id: bobChat.publicId }
          }).handle()
        ).json()
        expect(body.deletedAt).not.toBeNull()
        expect(body.messages).toHaveLength(2)
        expect(body.messages[1].metadata.gap).toEqual({ kind: 'no_courses' })
      })
    })

    it('404s on an unknown id', async () => {
      await withTestDb(async () => {
        await seed()
        await expect(
          route(GetChatDetails, {
            params: { id: '00000000-0000-0000-0000-000000000000' }
          }).handle()
        ).rejects.toBeInstanceOf(NotFoundError)
      })
    })
  })

  describe('GET /admin/chats/stats', () => {
    it('computes totals, the per-day series and the quality signals', async () => {
      await withTestDb(async () => {
        await seed()
        const body = await (
          await route(GetChatStats, { query: { days: 7 } }).handle()
        ).json()

        expect(body.days).toBe(7)
        expect(body.allTime).toEqual({
          chats: 2,
          deletedChats: 1,
          uniqueUsers: 2,
          questions: 2,
          answers: 2,
          costMicros: 15000,
          helpful: 0,
          notHelpful: 1
        })
        expect(body.window).toEqual(body.allTime)

        expect(body.perDay).toHaveLength(7)
        const today = body.perDay[body.perDay.length - 1]
        expect(today.chats).toBe(2)
        expect(today.questions).toBe(2)
        expect(today.uniqueUsers).toBe(2)
        expect(today.costMicros).toBe(15000)
        expect(today.notHelpful).toBe(1)
        // Zero-filled: a quiet day is a row, not a hole.
        expect(body.perDay[0]).toMatchObject({ chats: 0, questions: 0 })

        expect(body.latency.p50Ms).toBe(3000)
        expect(body.quality.guardsFired).toBe(1)
        expect(body.quality.hitIterationCap).toBe(1)
        expect(body.quality.gaps).toEqual([{ key: 'no_courses', count: 1 }])

        expect(body.topTools).toEqual([
          { key: 'search_courses', count: 2 },
          { key: 'get_course_reviews', count: 1 }
        ])
        expect(body.topCited).toHaveLength(1)
        expect(body.topCited[0].label).toContain('AMS')
        expect(body.byLanguage).toEqual(
          expect.arrayContaining([
            { key: 'pt', count: 1 },
            { key: 'en', count: 1 }
          ])
        )
        expect(body.byContextSource).toEqual(
          expect.arrayContaining([
            { key: 'degree_page', count: 1 },
            { key: 'none', count: 1 }
          ])
        )
        expect(body.returningUsers).toBe(0)
      })
    })
  })
})
