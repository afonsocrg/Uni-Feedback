import { CHAT_CONFIG } from '@config/chat'
import { database } from '@uni-feedback/db'
import type { Chat } from '@uni-feedback/db/schema'
import {
  chatMessageEntities,
  chatMessageFeedback,
  chatMessages,
  chats
} from '@uni-feedback/db/schema'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { and, desc, eq, gte, isNull, sql, type SQL } from 'drizzle-orm'
import {
  buildStudentContext,
  ChatContextService,
  type ChatScope
} from './chatContextService'
import { ChatGapDetector, type ChatGap } from './chatGap'
import { ChatLlmClient, type LlmMessage, type LlmUsage } from './chatLlm'
import {
  CHAT_SYSTEM_PROMPT,
  GROUNDING_CORRECTION,
  ITERATION_CAP_NUDGE,
  TITLE_PROMPT
} from './chatPrompt'
import { ChatToolExecutor, REVIEW_TOOL_NAMES } from './chatTools'
import { UserDegreeService } from './userDegreeService'

/**
 * Runs a chat turn: history in, grounded answer out, everything persisted.
 *
 * The two guards below are the reason this loop is not a thin wrapper around the
 * provider. Both enforce behaviour that **prompting provably could not buy** in
 * Phase 0, and both fire only in the failure case, so they cost nothing when the
 * prompt works.
 *
 * Plan: afonsocrg/prds/2026-08-09_ai_chat.md (Phase 2)
 */

export interface TurnResult {
  answer: string
  assistantMessageId: number
  usage: LlmUsage
  latencyMs: number
  iterations: number
  toolsUsed: string[]
  guardsFired: string[]
  hitIterationCap: boolean
  /** What retrieval went looking for and did not find, if anything. */
  gap: ChatGap | null
}

interface EntityRef {
  type: 'course' | 'degree' | 'faculty'
  id: number
}

/**
 * Detects an answer that puts words in students' mouths.
 *
 * Phase 0 regression: once the prompt demanded depth ("explain WHY it is hard",
 * "compare the curricula"), the model met that demand by INVENTING rather than by
 * fetching. Asked to compare IST with FCT NOVA it called only `search_degrees`
 * twice, then wrote "os estudantes destacam a exigência e a profundidade dos
 * cursos" having read zero reviews.
 *
 * Depth and grounding pull against each other, and this is the grounding side.
 */
const ATTRIBUTION_PATTERNS = [
  /\b(alunos|estudantes)\b[^.!?]{0,80}\b(dizem|disseram|mencionam|destacam|referem|acham|consideram|queixam|criticam|elogiam|apontam|descrevem|sentem|relatam)/i,
  /\b(segundo|de acordo com) os (alunos|estudantes)\b/i,
  /\bstudents\b[^.!?]{0,80}\b(say|said|mention|describe|note|report|find|found|complain|praise|highlight|feel)/i
]

export function attributesOpinionsWithoutReviews(
  answer: string,
  toolsUsed: string[]
): boolean {
  if (toolsUsed.some((t) => REVIEW_TOOL_NAMES.includes(t))) return false
  return ATTRIBUTION_PATTERNS.some((re) => re.test(answer))
}

/**
 * A reply that asks something without having looked anything up.
 *
 * The model cannot know a question is ambiguous before searching. Three prompt
 * rewrites, including an explicit numbered rule at the top, failed to stop it
 * asking "which university?" about a degree that exists at exactly one.
 *
 * Deliberately narrow: refusals and off-topic declines also skip the tools, and
 * forcing a search on those made them cost twice as much for nothing. Only a
 * *question* asked from zero knowledge is worth a retry.
 */
export function askedWithoutSearching(
  answer: string,
  toolsUsed: string[]
): boolean {
  return toolsUsed.length === 0 && answer.includes('?')
}

export class ChatService {
  private readonly llm: ChatLlmClient
  private readonly tools: ChatToolExecutor
  private readonly context: ChatContextService
  private readonly degrees: UserDegreeService

  constructor(
    private readonly env: Env,
    deps: {
      llm?: ChatLlmClient
      tools?: ChatToolExecutor
      context?: ChatContextService
      degrees?: UserDegreeService
    } = {}
  ) {
    this.llm = deps.llm ?? new ChatLlmClient(env)
    this.tools = deps.tools ?? new ChatToolExecutor()
    this.context = deps.context ?? new ChatContextService()
    this.degrees = deps.degrees ?? new UserDegreeService()
  }

  // -------------------------------------------------------------------------
  // Limits
  // -------------------------------------------------------------------------

  /** Messages this user has sent today, for the quota. */
  async countMessagesToday(userId: number): Promise<number> {
    const since = startOfToday()
    const [row] = await database()
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .innerJoin(chats, eq(chatMessages.chatId, chats.id))
      .where(
        and(
          eq(chats.userId, userId),
          eq(chatMessages.role, 'user'),
          gte(chatMessages.createdAt, since)
        )
      )
    return Number(row?.count ?? 0)
  }

  /**
   * Total spend today across every user, in micro-euros.
   *
   * The kill switch this feeds has to exist before launch day, not after a bad
   * night. It degrades to "the chat is resting" rather than erroring.
   */
  async spendTodayMicros(): Promise<number> {
    const [row] = await database()
      .select({
        total: sql<number>`coalesce(sum(${chatMessages.costMicros}), 0)`
      })
      .from(chatMessages)
      .where(gte(chatMessages.createdAt, startOfToday()))
    return Number(row?.total ?? 0)
  }

  // -------------------------------------------------------------------------
  // Chats
  // -------------------------------------------------------------------------

  async createChat(input: {
    userId: number
    language?: string | null
    scope?: ChatScope
  }) {
    const [chat] = await database()
      .insert(chats)
      .values({
        userId: input.userId,
        language: input.language ?? null,
        contextFacultyId: input.scope?.facultyId ?? null,
        contextDegreeId: input.scope?.degreeId ?? null,
        contextCourseId: input.scope?.courseId ?? null,
        contextSource: input.scope?.source ?? null
      })
      .returning()
    return chat
  }

  /** Resolves the URL's public id to the row, scoped to its owner. */
  async findChat(publicId: string, userId: number) {
    const [chat] = await database()
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.publicId, publicId),
          eq(chats.userId, userId),
          isNull(chats.deletedAt)
        )
      )
      .limit(1)
    return chat ?? null
  }

  async listChats(userId: number, limit = 30) {
    return database()
      .select({
        // The internal id never leaves the server.
        id: chats.publicId,
        title: chats.title,
        createdAt: chats.createdAt,
        lastMessageAt: chats.lastMessageAt
      })
      .from(chats)
      .where(and(eq(chats.userId, userId), isNull(chats.deletedAt)))
      .orderBy(desc(sql`coalesce(${chats.lastMessageAt}, ${chats.createdAt})`))
      .limit(limit)
  }

  /**
   * The conversation, optionally with the caller's own rating on each answer.
   *
   * `userId` is what scopes the rating join: one student must never see how
   * another rated an answer, and only their own is theirs to change.
   */
  async getMessages(chatId: number, userId?: number) {
    return database()
      .select({
        id: chatMessages.id,
        seq: chatMessages.seq,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        rating: chatMessageFeedback.rating
      })
      .from(chatMessages)
      .leftJoin(
        chatMessageFeedback,
        userId === undefined
          ? sql`false`
          : and(
              eq(chatMessageFeedback.messageId, chatMessages.id),
              eq(chatMessageFeedback.userId, userId)
            )
      )
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          // Tool traffic is persisted for debugging but is not conversation.
          sql`${chatMessages.role} in ('user', 'assistant')`
        )
      )
      .orderBy(chatMessages.seq)
  }

  /** Soft delete: hides the chat, never destroys the record. */
  async deleteChat(publicId: string, userId: number): Promise<boolean> {
    const result = await database()
      .update(chats)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(chats.publicId, publicId),
          eq(chats.userId, userId),
          isNull(chats.deletedAt)
        )
      )
      .returning({ id: chats.id })
    return result.length > 0
  }

  // -------------------------------------------------------------------------
  // The turn
  // -------------------------------------------------------------------------

  /**
   * Starts a conversation with its first message.
   *
   * One call, deliberately. Creating the chat and sending the first message
   * used to be two, and every gate (coverage, quota, kill switch) ran inside the
   * second one, so a refused send left an empty chat behind. The caller is
   * expected to have run the gates before this, and if the turn itself fails
   * before producing an answer the row is removed rather than stranded.
   *
   * It also means the chat is named the moment it exists: the title is
   * generated from the first exchange in the same request, so it never appears
   * in the sidebar as "Nova conversa".
   */
  async startChat(input: {
    userId: number
    content: string
    language?: string | null
    scope?: ChatScope
    onProgress?: (info: { tool: string }) => void
  }): Promise<{ chat: Chat; turn: TurnResult }> {
    const chat = await this.createChat({
      userId: input.userId,
      language: input.language,
      scope: input.scope
    })

    try {
      const turn = await this.sendMessage({
        chat,
        userId: input.userId,
        content: input.content,
        onProgress: input.onProgress
      })
      return { chat, turn }
    } catch (error) {
      // Nothing was answered, so there is no conversation to keep. Hard delete:
      // a chat that never had an answer is not a record of anything. Unless the
      // failed turn already spent money: then the cost lives on its question and
      // the spend ceiling has to keep seeing it, so the chat is only hidden.
      const [row] = await database()
        .select({
          spent: sql<number>`coalesce(sum(${chatMessages.costMicros}), 0)`
        })
        .from(chatMessages)
        .where(eq(chatMessages.chatId, chat.id))
      if (Number(row?.spent ?? 0) > 0) {
        await database()
          .update(chats)
          .set({ deletedAt: new Date() })
          .where(eq(chats.id, chat.id))
      } else {
        await database().delete(chats).where(eq(chats.id, chat.id))
      }
      throw error
    }
  }

  async sendMessage(input: {
    chat: Chat
    userId: number
    content: string
    /** Fired as each tool starts, so the UI can show what is happening. */
    onProgress?: (info: { tool: string }) => void
  }): Promise<TurnResult> {
    const started = Date.now()
    const chat = input.chat

    const nextSeq = await this.nextSeq(chat.id)
    // Its `mentioned` entities are written after the turn: what the student
    // meant is only known once the model has resolved it.
    const userMessageId = await this.persistMessage({
      chatId: chat.id,
      seq: nextSeq,
      role: 'user',
      content: input.content,
      entities: [],
      relation: 'mentioned'
    })

    const context = await this.context.build({
      facultyId: chat.contextFacultyId,
      degreeId: chat.contextDegreeId,
      courseId: chat.contextCourseId
    })

    // Seed the URL map with the context block's own entities: the model can cite
    // a link it read there rather than from a tool result, and a scoped chat is
    // the common case from a course-page entry point.
    const seededUrls = new Map<string, EntityRef>(
      context.entities.map((e) => [e.pageUrl, { type: e.type, id: e.id }])
    )

    // Appended after the chat's scope, so the static prompt stays a cacheable
    // prefix. Read per turn rather than per chat: a degree saved mid-chat
    // should apply to the next answer.
    const student = buildStudentContext(
      await this.degrees.getJourney(input.userId),
      getCurrentSchoolYear()
    )

    const history = await this.buildHistory(chat.id)
    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: [CHAT_SYSTEM_PROMPT, context.markdown, student]
          .filter(Boolean)
          .join('\n\n')
      },
      ...history
    ]

    // Owned here rather than by the loop, so a turn that throws halfway still
    // tells us what it spent.
    const usage: LlmUsage = { inputTokens: 0, outputTokens: 0, costMicros: 0 }
    let turn: Awaited<ReturnType<ChatService['runToolLoop']>>
    try {
      turn = await this.runToolLoop(
        messages,
        seededUrls,
        usage,
        input.onProgress
      )
    } catch (error) {
      // Every call before the failure was paid for. Charged to the question,
      // since there is no answer to carry it, so the spend ceiling sees it.
      if (usage.costMicros > 0 || usage.inputTokens > 0) {
        await database()
          .update(chatMessages)
          .set({
            model: CHAT_CONFIG.model,
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            costMicros: usage.costMicros
          })
          .where(eq(chatMessages.id, userMessageId))
      }
      throw error
    }
    turn.answer = withoutEmDashes(turn.answer)

    // What the student was asking about: the courses and degrees the model
    // looked up by id. A turn that looked nothing up by id (a filtered search,
    // or an answer from the context block alone) falls back to the chat's scope.
    await this.insertEntities(
      userMessageId,
      turn.targeted.length > 0 ? turn.targeted : scopeEntities(chat),
      'mentioned'
    )

    const assistantSeq = nextSeq + 1
    const assistantMessageId = await this.persistMessage({
      chatId: chat.id,
      seq: assistantSeq,
      role: 'assistant',
      content: turn.answer,
      entities: turn.entities,
      relation: 'retrieved',
      citedEntities: citedFrom(turn.answer, turn.entityUrls),
      metadata: {
        toolCalls: turn.toolCalls,
        guardsFired: turn.guardsFired,
        hitIterationCap: turn.hitIterationCap,
        contextTokens: context.estimatedTokens,
        // What the turn looked for and did not find. Stored as well as sent, so
        // "which gaps do students hit most" is a query rather than a guess.
        gap: turn.gap
      },
      model: CHAT_CONFIG.model,
      usage: turn.usage,
      latencyMs: Date.now() - started
    })

    await database()
      .update(chats)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(chats.id, chat.id))

    return {
      answer: turn.answer,
      assistantMessageId,
      usage: turn.usage,
      latencyMs: Date.now() - started,
      iterations: turn.iterations,
      toolsUsed: turn.toolsUsed,
      guardsFired: turn.guardsFired,
      hitIterationCap: turn.hitIterationCap,
      gap: turn.gap
    }
  }

  /**
   * The agent loop.
   *
   * Progress, not tokens. A tool-calling turn is not a single stream: it is
   * several provider calls with tool execution between them, and either guard
   * can restart it. The spike measured 3 to 14 seconds, so the honest signal for
   * the UI is "still working, and here is what I am doing".
   */
  private async runToolLoop(
    messages: LlmMessage[],
    entityUrls: Map<string, EntityRef>,
    usage: LlmUsage,
    onProgress?: (info: { tool: string }) => void
  ) {
    const toolCalls: ToolCallRecord[] = []
    const toolsUsed: string[] = []
    // Only calls that returned data. `toolsUsed` is the record of what the
    // model attempted, and is what gets logged and shown; the guards below have
    // to judge on what it actually READ. A `get_course_reviews` that threw put
    // no review in front of the model, so counting it would let an answer
    // speak for students on the strength of an error message.
    const toolsSucceeded: string[] = []
    const entities: EntityRef[] = []
    // The ids the model passed in, as opposed to everything the tools returned.
    const targeted: EntityRef[] = []
    const guardsFired: string[] = []
    const gaps = new ChatGapDetector()

    let retriedSearch = false
    let retriedGrounding = false
    let forceToolCall = false
    let iterations = 0

    for (let i = 0; i < CHAT_CONFIG.maxToolIterations; i++) {
      iterations = i + 1

      const completion = await this.llm.complete({
        model: CHAT_CONFIG.model,
        messages,
        forceToolCall
      })
      forceToolCall = false

      usage.inputTokens += completion.usage.inputTokens
      usage.outputTokens += completion.usage.outputTokens
      usage.costMicros += completion.usage.costMicros

      const { message } = completion
      messages.push(message)

      const calls = message.tool_calls ?? []

      if (calls.length === 0) {
        const answer = message.content ?? ''

        // Guard 1: asked a question without looking anything up.
        if (!retriedSearch && askedWithoutSearching(answer, toolsSucceeded)) {
          retriedSearch = true
          guardsFired.push('forced_search')
          messages.pop()
          forceToolCall = true
          continue
        }

        // Guard 2: spoke for students without reading a review.
        if (
          !retriedGrounding &&
          attributesOpinionsWithoutReviews(answer, toolsSucceeded)
        ) {
          retriedGrounding = true
          guardsFired.push('grounding')
          messages.push({ role: 'user', content: GROUNDING_CORRECTION })
          continue
        }

        return {
          answer: answer || '(empty answer)',
          usage,
          toolCalls,
          toolsUsed,
          entities,
          targeted,
          entityUrls,
          guardsFired,
          iterations,
          hitIterationCap: false,
          gap: gaps.result()
        }
      }

      // The calls of one step are independent (the model wrote them all
      // before seeing any result), so they run in parallel. Run one after
      // another, six get_course calls cost six round trips of waiting.
      // Bookkeeping below stays in call order, so the transcript and the
      // tool messages read the same as before.
      const maxCalls = CHAT_CONFIG.maxToolCallsPerIteration
      const maxPlans = CHAT_CONFIG.maxDegreePlansPerIteration
      let plans = 0
      const refused = calls.map((call, index) => {
        if (index >= maxCalls) return true
        if (call.function.name !== 'get_degree') return false
        plans += 1
        return plans > maxPlans
      })
      const executed = await Promise.all(
        calls.map(async (call, index) => {
          const started = Date.now()
          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(call.function.arguments || '{}')
          } catch {
            args = {}
          }
          // Capped per step, not only per turn: one step could otherwise ask
          // for a dozen whole degree plans at once.
          if (refused[index]) {
            return {
              args,
              payload: { error: TOO_MANY_CALLS(maxCalls, maxPlans) },
              found: [] as EntityRef[],
              ms: 0
            }
          }
          onProgress?.({ tool: call.function.name })
          try {
            const result = await this.tools.execute(call.function.name, args)
            return {
              args,
              payload: result.payload,
              found: result.entities,
              ms: Date.now() - started
            }
          } catch (error) {
            return {
              args,
              payload: {
                error: error instanceof Error ? error.message : String(error)
              },
              found: [] as EntityRef[],
              ms: Date.now() - started
            }
          }
        })
      )

      calls.forEach((call, index) => {
        const { args, payload, found, ms } = executed[index]

        // A payload of `{ error }` is the executor's own refusal (missing id,
        // unknown course) and put no data in front of the model either.
        if (!isErrorPayload(payload)) {
          toolsSucceeded.push(call.function.name)
          const target = targetOf(call.function.name, args)
          if (
            target &&
            !targeted.some((e) => e.type === target.type && e.id === target.id)
          ) {
            targeted.push(target)
          }
          collectUrls(payload, entityUrls)
        }
        for (const entity of found) {
          if (
            !entities.some((e) => e.type === entity.type && e.id === entity.id)
          ) {
            entities.push(entity)
          }
        }

        gaps.observe(call.function.name, payload)

        toolsUsed.push(call.function.name)
        toolCalls.push({
          name: call.function.name,
          args,
          ms,
          ...recordResult(payload)
        })

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(payload)
        })
      })
    }

    // Out of iterations. Seen on production (2026-09-16): a question with
    // three filters had the model retrying one search with small variations
    // until the cap, and the student got an apology while the data it had
    // already read would have answered them. One last call with tools
    // forbidden turns that into an answer from what it has; the apology is
    // only for when even that comes back empty.
    messages.push({ role: 'user', content: ITERATION_CAP_NUDGE })
    const final = await this.llm.complete({
      model: CHAT_CONFIG.model,
      messages,
      forbidToolCalls: true
    })
    usage.inputTokens += final.usage.inputTokens
    usage.outputTokens += final.usage.outputTokens
    usage.costMicros += final.usage.costMicros
    const finalAnswer = final.message.tool_calls?.length
      ? ''
      : (final.message.content ?? '').trim()

    return {
      answer:
        finalAnswer ||
        'Desculpa, não consegui chegar a uma resposta. Podes reformular a pergunta?',
      usage,
      toolCalls,
      toolsUsed,
      entities,
      targeted,
      entityUrls,
      guardsFired,
      iterations,
      hitIterationCap: true,
      gap: gaps.result()
    }
  }

  // -------------------------------------------------------------------------
  // Title
  // -------------------------------------------------------------------------

  /**
   * Names the chat from its first exchange, on the cheap tier.
   *
   * Best-effort: a chat without a title is a cosmetic problem, so a failure here
   * must never fail the turn that produced the answer.
   */
  async generateTitle(chatId: number): Promise<string | null> {
    try {
      const messages = await this.getMessages(chatId)
      if (messages.length < 2) return null

      const transcript = messages
        .slice(0, 2)
        .map(
          (m) =>
            `${m.role === 'user' ? 'Student' : 'Assistant reply'}: ${m.content.slice(0, 500)}`
        )
        .join('\n\n')

      const completion = await this.llm.complete({
        model: CHAT_CONFIG.cheapModel,
        withTools: false,
        maxTokens: 30,
        messages: [
          { role: 'system', content: TITLE_PROMPT },
          { role: 'user', content: transcript }
        ]
      })

      // Added to the first answer, which is what it was spent on, so the spend
      // ceiling counts it. Only the cost: the tokens are another model's.
      if (completion.usage.costMicros > 0) {
        await database()
          .update(chatMessages)
          .set({
            costMicros: sql`coalesce(${chatMessages.costMicros}, 0) + ${completion.usage.costMicros}`
          })
          .where(eq(chatMessages.id, messages[1].id))
      }

      const title = (completion.message.content ?? '')
        .trim()
        .replace(/^["'“”]|["'“”]$/g, '')
        .slice(0, 80)
      if (!title) return null

      await database()
        .update(chats)
        .set({ title, updatedAt: new Date() })
        .where(eq(chats.id, chatId))

      return title
    } catch (error) {
      console.error('Failed to generate chat title:', error)
      return null
    }
  }

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------

  private async nextSeq(chatId: number): Promise<number> {
    const [row] = await database()
      .select({ max: sql<number>`coalesce(max(${chatMessages.seq}), 0)` })
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
    return Number(row?.max ?? 0) + 1
  }

  private async persistMessage(input: {
    chatId: number
    seq: number
    role: 'user' | 'assistant'
    content: string
    entities: EntityRef[]
    relation: 'mentioned' | 'retrieved'
    citedEntities?: EntityRef[]
    metadata?: Record<string, unknown>
    model?: string
    usage?: LlmUsage
    latencyMs?: number
  }): Promise<number> {
    const [message] = await database()
      .insert(chatMessages)
      .values({
        chatId: input.chatId,
        seq: input.seq,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? {},
        model: input.model ?? null,
        inputTokens: input.usage?.inputTokens ?? null,
        outputTokens: input.usage?.outputTokens ?? null,
        costMicros: input.usage?.costMicros ?? null,
        latencyMs: input.latencyMs ?? null
      })
      .returning({ id: chatMessages.id })

    await this.insertEntities(message.id, input.entities, input.relation)
    await this.insertEntities(message.id, input.citedEntities ?? [], 'cited')

    return message.id
  }

  private async insertEntities(
    messageId: number,
    entities: EntityRef[],
    relation: 'mentioned' | 'retrieved' | 'cited'
  ): Promise<void> {
    if (entities.length === 0) return
    await database()
      .insert(chatMessageEntities)
      .values(
        entities.map((e) => ({
          messageId,
          entityType: e.type,
          entityId: e.id,
          relation
        }))
      )
      .onConflictDoNothing()
  }

  /** Conversation history, trimmed to the most recent turns. */
  private async buildHistory(chatId: number): Promise<LlmMessage[]> {
    const rows = await database()
      .select({
        role: chatMessages.role,
        content: chatMessages.content
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          sql`${chatMessages.role} in ('user', 'assistant')`
        )
      )
      .orderBy(desc(chatMessages.seq))
      .limit(CHAT_CONFIG.maxHistoryMessages)

    return rows
      .reverse()
      .map((r) => ({ role: r.role, content: r.content }) as LlmMessage)
  }
}

// ---------------------------------------------------------------------------

/**
 * Em dashes out of the model's own prose, quotes left alone.
 *
 * The prompt forbids them and the model writes them anyway (seen on
 * production, 2026-09-11), so this is the harness enforcing a copy rule the
 * prompt can only ask for. Text inside quotation marks is a student's review
 * and is quoted verbatim, dashes included.
 */
export function withoutEmDashes(answer: string): string {
  return answer
    .split(/(“[^”]*”|"[^"\n]*")/)
    .map((part, i) =>
      // Odd indexes are the captured quotes.
      i % 2 === 1 ? part : part.replace(/[ \t]*—[ \t]*/g, ', ')
    )
    .join('')
}

function isErrorPayload(payload: unknown): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    Object.keys(payload).length === 1
  )
}

/** What the model reads for a call past the per-step cap. */
const TOO_MANY_CALLS = (max: number, plans: number) =>
  `Not run: at most ${max} tool calls per step, ${plans} of them get_degree. Call again with the ones you still need, or cover several items in one call (search_courses with \`queries\` or filters, get_degree with \`curriculumYear\`).`

/** The entity a tool call asked for by id, if it asked for one. */
function targetOf(
  tool: string,
  args: Record<string, unknown>
): EntityRef | null {
  const id = (key: string) => {
    const value = Number(args[key])
    // Zero is a placeholder, not an id (see `chatTools.ts`).
    return Number.isInteger(value) && value > 0 ? value : null
  }
  if (tool === 'get_course' || tool === 'get_course_reviews') {
    const courseId = id('courseId')
    return courseId ? { type: 'course', id: courseId } : null
  }
  if (tool === 'get_degree') {
    const degreeId = id('degreeId')
    return degreeId ? { type: 'degree', id: degreeId } : null
  }
  return null
}

/** What the chat was opened about, most specific first. */
function scopeEntities(chat: Chat): EntityRef[] {
  const refs: EntityRef[] = []
  if (chat.contextCourseId)
    refs.push({ type: 'course', id: chat.contextCourseId })
  if (chat.contextDegreeId)
    refs.push({ type: 'degree', id: chat.contextDegreeId })
  if (chat.contextFacultyId)
    refs.push({ type: 'faculty', id: chat.contextFacultyId })
  return refs
}

/**
 * Midnight in Lisbon, computed by Postgres. The quota and the spend ceiling reset
 * on the students' day, not the container's: the container sets no timezone, so
 * a JS `new Date()` midnight was midnight UTC (1am in Lisbon during summer time).
 */
function startOfToday(): SQL {
  return sql`date_trunc('day', now() at time zone 'Europe/Lisbon') at time zone 'Europe/Lisbon'`
}

/**
 * Harvests pageUrl -> entity from a tool payload, so we can tell afterwards which
 * entities the answer actually linked to.
 *
 * `retrieved` and `cited` answer different questions: what we fetched, versus
 * what we actually showed the student. Splitting them is cheap now and impossible
 * to recover later.
 */
function collectUrls(node: unknown, into: Map<string, EntityRef>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectUrls(item, into)
    return
  }
  if (typeof node !== 'object' || node === null) return

  const record = node as Record<string, unknown>
  const url = record.pageUrl
  if (typeof url === 'string') {
    if (typeof record.courseId === 'number') {
      into.set(url, { type: 'course', id: record.courseId })
    } else if (typeof record.degreeId === 'number') {
      into.set(url, { type: 'degree', id: record.degreeId })
    } else if (typeof record.id === 'number') {
      into.set(url, { type: 'faculty', id: record.id })
    }
  }

  for (const value of Object.values(record)) collectUrls(value, into)
}

function citedFrom(answer: string, urls: Map<string, EntityRef>): EntityRef[] {
  const cited: EntityRef[] = []
  for (const [url, entity] of urls) {
    if (answer.includes(url)) cited.push(entity)
  }
  return cited
}

/**
 * One tool call as stored on the assistant message, for the admin transcript.
 *
 * The result is kept as well as the arguments: an answer that is fluent and
 * wrong is usually a retrieval that came back thin, and without the payload the
 * reader can only guess which. Capped so a course with hundreds of reviews does
 * not turn one message row into a megabyte; the cut is marked and the size
 * kept, since "the model saw 80KB" is itself a debugging fact.
 */
export interface ToolCallRecord {
  name: string
  args: unknown
  ms: number
  result?: unknown
  resultTruncated?: boolean
  resultBytes?: number
}

const TOOL_RESULT_STORE_LIMIT = 16_000

function recordResult(
  payload: unknown
): Pick<ToolCallRecord, 'result' | 'resultTruncated' | 'resultBytes'> {
  let json: string
  try {
    json = JSON.stringify(payload) ?? 'null'
  } catch {
    return { result: { error: 'unserialisable tool result' } }
  }
  if (json.length <= TOOL_RESULT_STORE_LIMIT) {
    return { result: payload, resultBytes: json.length }
  }
  return {
    result: json.slice(0, TOOL_RESULT_STORE_LIMIT),
    resultTruncated: true,
    resultBytes: json.length
  }
}
