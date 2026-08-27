import { database } from '@uni-feedback/db'
import { chatMessageEntities, chatMessages } from '@uni-feedback/db/schema'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApprovedFeedback,
  createCourse,
  createDegree,
  createFaculty,
  createUser,
  initCourseStats
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import type { CompleteOptions, LlmCompletion } from '../chatLlm'
import { ChatLlmClient } from '../chatLlm'
import {
  ChatService,
  askedWithoutSearching,
  attributesOpinionsWithoutReviews
} from '../chatService'

/**
 * A scripted model.
 *
 * The point of these tests is the loop and the guards, not the provider, so the
 * model is replaced by a queue of canned completions and every call is recorded.
 */
class StubLlm extends ChatLlmClient {
  public calls: CompleteOptions[] = []

  constructor(private queue: Array<Partial<LlmCompletion>>) {
    super({} as Env)
  }

  async complete(options: CompleteOptions): Promise<LlmCompletion> {
    this.calls.push(options)
    const next = this.queue.shift()
    if (!next) throw new Error('StubLlm ran out of scripted completions')
    return {
      message: next.message ?? { role: 'assistant', content: 'ok' },
      finishReason: next.finishReason ?? 'stop',
      usage: next.usage ?? { inputTokens: 10, outputTokens: 5, costMicros: 100 }
    }
  }
}

function say(content: string): Partial<LlmCompletion> {
  return { message: { role: 'assistant', content } }
}

function callTool(
  name: string,
  args: Record<string, unknown> = {}
): Partial<LlmCompletion> {
  return {
    message: {
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: `call_${name}`,
          type: 'function',
          function: { name, arguments: JSON.stringify(args) }
        }
      ]
    }
  }
}

describe('ChatService', () => {
  beforeEach(async () => {
    await cleanAllTables()
  })

  async function seed() {
    const user = await createUser({ email: 'aluno@tecnico.ulisboa.pt' })
    const faculty = await createFaculty({
      name: 'Instituto Superior Técnico',
      shortName: 'IST',
      slug: 'ist',
      chatEnabled: true
    })
    const degree = await createDegree(faculty.id, {
      name: 'Licenciatura em Engenharia Informática e de Computadores',
      acronym: 'LEIC',
      slug: 'leic'
    })
    const course = await createCourse(degree.id, {
      name: 'Análise e Modelação de Sistemas',
      acronym: 'AMS'
    })
    await initCourseStats(course.id)
    await createApprovedFeedback(course.id, {
      rating: 2,
      comment: 'O projeto é muito trabalhoso.'
    })
    return { user, faculty, degree, course }
  }

  function service(queue: Array<Partial<LlmCompletion>>) {
    const llm = new StubLlm(queue)
    return { service: new ChatService({} as Env, { llm }), llm }
  }

  describe('the tool loop', () => {
    it('runs tools and returns the final answer', async () => {
      await withTestDb(async () => {
        const { user, course } = await seed()
        const { service: chat } = service([
          callTool('get_course_reviews', { courseId: course.id }),
          say('Os alunos dizem que o projeto é trabalhoso.')
        ])

        const created = await chat.createChat({ userId: user.id })
        const result = await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'O que dizem sobre AMS?'
        })

        expect(result.answer).toContain('projeto')
        expect(result.toolsUsed).toEqual(['get_course_reviews'])
        expect(result.usage.costMicros).toBe(200) // two provider calls
      })
    })

    it('stops at the iteration cap instead of looping forever', async () => {
      await withTestDb(async () => {
        const { user, course } = await seed()
        // A model that only ever wants another tool call.
        const { service: chat } = service(
          Array.from({ length: 12 }, () =>
            callTool('get_course', { courseId: course.id })
          )
        )

        const created = await chat.createChat({ userId: user.id })
        const result = await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'loop'
        })

        expect(result.hitIterationCap).toBe(true)
        expect(result.iterations).toBe(8)
      })
    })
  })

  describe('guard: asked without searching', () => {
    it('retries once, forcing a tool call', async () => {
      await withTestDb(async () => {
        const { user, course } = await seed()
        const { service: chat, llm } = service([
          // Asks "which university?" having looked at nothing.
          say('De que universidade estás a falar?'),
          callTool('search_courses', { query: 'AMS' }),
          say(
            `Encontrei AMS em LEIC. https://uni-feedback.com/cadeiras/${course.id}`
          )
        ])

        const created = await chat.createChat({ userId: user.id })
        const result = await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'Fala-me de AMS'
        })

        expect(result.guardsFired).toContain('forced_search')
        // The retry is the only call that forces a tool, and it must happen.
        expect(llm.calls.filter((c) => c.forceToolCall)).toHaveLength(1)
        expect(result.answer).toContain('AMS')
      })
    })

    it('leaves a refusal alone, so it stays cheap', async () => {
      await withTestDb(async () => {
        const { user } = await seed()
        const { service: chat, llm } = service([
          say('A Uni Feedback não tem informação sobre notas de entrada.')
        ])

        const created = await chat.createChat({ userId: user.id })
        const result = await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'Qual foi a nota do último colocado?'
        })

        // Forcing a search here made refusals cost twice as much for nothing.
        expect(result.guardsFired).toHaveLength(0)
        expect(llm.calls).toHaveLength(1)
      })
    })
  })

  describe('guard: opinions without reviews', () => {
    it('sends the answer back when it speaks for students unprompted', async () => {
      await withTestDb(async () => {
        const { user, degree } = await seed()
        const { service: chat } = service([
          callTool('get_degree', { degreeId: degree.id }),
          // Never read a review, yet describes what students think.
          say('Os estudantes destacam a exigência e a profundidade do curso.'),
          callTool('get_course_reviews', { courseId: 1 }),
          say('Um aluno escreveu: "O projeto é muito trabalhoso."')
        ])

        const created = await chat.createChat({ userId: user.id })
        const result = await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'Como é o LEIC?'
        })

        expect(result.guardsFired).toContain('grounding')
        expect(result.answer).toContain('Um aluno escreveu')
      })
    })

    it('does not fire when reviews were actually read', async () => {
      await withTestDb(async () => {
        const { user, course } = await seed()
        const { service: chat } = service([
          callTool('get_course_reviews', { courseId: course.id }),
          say('Os alunos dizem que o projeto é trabalhoso.')
        ])

        const created = await chat.createChat({ userId: user.id })
        const result = await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'O que dizem sobre AMS?'
        })

        expect(result.guardsFired).toHaveLength(0)
      })
    })
  })

  describe('persistence', () => {
    it('stores both messages with cost and latency', async () => {
      await withTestDb(async () => {
        const { user, course } = await seed()
        const { service: chat } = service([
          callTool('get_course', { courseId: course.id }),
          say('AMS tem 6 ECTS.')
        ])

        const created = await chat.createChat({ userId: user.id })
        await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'Quantos ECTS tem AMS?'
        })

        const stored = await database()
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.chatId, created.id))
          .orderBy(chatMessages.seq)

        expect(stored).toHaveLength(2)
        expect(stored[0].role).toBe('user')
        expect(stored[1].role).toBe('assistant')
        expect(stored[1].costMicros).toBe(200)
        expect(stored[1].latencyMs).not.toBeNull()
      })
    })

    it('separates what was retrieved from what was actually cited', async () => {
      await withTestDb(async () => {
        const { user, course } = await seed()
        const { service: chat } = service([
          callTool('search_courses', { query: 'AMS' }),
          // Links one of the retrieved courses, which makes it 'cited' too.
          say(`Vê https://uni-feedback.com/cadeiras/${course.id}`)
        ])

        const created = await chat.createChat({ userId: user.id })
        const result = await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'AMS?'
        })

        const links = await database()
          .select()
          .from(chatMessageEntities)
          .where(eq(chatMessageEntities.messageId, result.assistantMessageId))

        const relations = links.map((l) => l.relation)
        expect(relations).toContain('retrieved')
        // The split is the whole point of the polymorphic table: what we fetched
        // versus what we actually showed the student.
        expect(relations).toContain('cited')
        expect(links.find((l) => l.relation === 'cited')?.entityId).toBe(
          course.id
        )
      })
    })

    it('keeps conversation history across turns', async () => {
      await withTestDb(async () => {
        const { user } = await seed()
        const { service: chat, llm } = service([
          say('Primeira resposta.'),
          say('Segunda resposta.')
        ])

        const created = await chat.createChat({ userId: user.id })
        await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'Primeira pergunta'
        })
        await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'Segunda pergunta'
        })

        // System prompt + the first exchange + the new question.
        const secondTurn = llm.calls[1]
        const contents = secondTurn.messages.map((m) =>
          'content' in m ? m.content : ''
        )
        expect(contents).toContain('Primeira pergunta')
        expect(contents).toContain('Primeira resposta.')
        expect(contents).toContain('Segunda pergunta')
      })
    })
  })

  describe('limits', () => {
    it("counts only the user's own messages toward the daily quota", async () => {
      await withTestDb(async () => {
        const { user } = await seed()
        const other = await createUser({ email: 'outro@tecnico.ulisboa.pt' })
        const { service: chat } = service([say('a'), say('b')])

        const mine = await chat.createChat({ userId: user.id })
        await chat.sendMessage({
          chatId: mine.id,
          userId: user.id,
          content: 'uma'
        })

        const theirs = await chat.createChat({ userId: other.id })
        await chat.sendMessage({
          chatId: theirs.id,
          userId: other.id,
          content: 'outra'
        })

        expect(await chat.countMessagesToday(user.id)).toBe(1)
        expect(await chat.countMessagesToday(other.id)).toBe(1)
      })
    })

    it('sums spend across everyone for the kill switch', async () => {
      await withTestDb(async () => {
        const { user } = await seed()
        const { service: chat } = service([say('a'), say('b')])

        const created = await chat.createChat({ userId: user.id })
        await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'uma'
        })
        await chat.sendMessage({
          chatId: created.id,
          userId: user.id,
          content: 'duas'
        })

        // The ceiling is global, not per user: one runaway user must not need a
        // separate mechanism to stop.
        expect(await chat.spendTodayMicros()).toBe(200)
      })
    })
  })

  describe('soft delete', () => {
    it('hides the chat without destroying it', async () => {
      await withTestDb(async () => {
        const { user } = await seed()
        const { service: chat } = service([])
        const created = await chat.createChat({ userId: user.id })

        expect(await chat.deleteChat(created.id, user.id)).toBe(true)
        expect(await chat.findChat(created.id, user.id)).toBeNull()
        expect(await chat.listChats(user.id)).toHaveLength(0)
        // Deleting twice is not an error the caller should have to handle, but
        // it must not report success either.
        expect(await chat.deleteChat(created.id, user.id)).toBe(false)
      })
    })

    it("refuses to delete someone else's chat", async () => {
      await withTestDb(async () => {
        const { user } = await seed()
        const other = await createUser({ email: 'outro@tecnico.ulisboa.pt' })
        const { service: chat } = service([])
        const created = await chat.createChat({ userId: user.id })

        expect(await chat.deleteChat(created.id, other.id)).toBe(false)
        expect(await chat.findChat(created.id, user.id)).not.toBeNull()
      })
    })
  })
})

describe('guard predicates', () => {
  it('spots opinions attributed without reading reviews', () => {
    expect(
      attributesOpinionsWithoutReviews('Os alunos dizem que é difícil.', [])
    ).toBe(true)
    expect(
      attributesOpinionsWithoutReviews('Students found it demanding.', [
        'search_courses'
      ])
    ).toBe(true)
    // Reviews were read, so the claim is grounded.
    expect(
      attributesOpinionsWithoutReviews('Os alunos dizem que é difícil.', [
        'get_course_reviews'
      ])
    ).toBe(false)
    // No claim about students at all.
    expect(attributesOpinionsWithoutReviews('AMS tem 6 ECTS.', [])).toBe(false)
  })

  it('spots a question asked from zero knowledge', () => {
    expect(askedWithoutSearching('De que universidade falas?', [])).toBe(true)
    // Already searched, so the question is informed.
    expect(
      askedWithoutSearching('Queres LEIC ou MEIC?', ['search_degrees'])
    ).toBe(false)
    // A refusal is not a question, and forcing a search on it wastes money.
    expect(askedWithoutSearching('Não temos essa informação.', [])).toBe(false)
  })
})
